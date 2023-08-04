import { Injectable } from "@nestjs/common";
import { AccountDetailsDTO, AccountStatus, AccountType, ConfirmedTradeDTO, DealStatusType, IClosePositionSettings, IOpenPositionSettings, PositionDirection, PositionStatusType, ReasonConditionEnum } from "@project-zero/models";
import { ExchangeStreamingService } from "../exchange-streaming/exchange-streaming.service";
import { CacheService } from "../../shared";
import { BackTestDemoAccount } from "../../models";

@Injectable()
export class ExchangeApiService {
  private _demoAccountDetails: AccountDetailsDTO;

  constructor(
    private readonly _exchangeStreamingService: ExchangeStreamingService,
    private readonly _cacheService: CacheService
  ) {}

  /*************
  ** POSITION **
  *************/

  async createPosition({ epic, direction, positionSize }: IOpenPositionSettings): Promise<ConfirmedTradeDTO> {
    // get current snapshots
    const snapshots = this._exchangeStreamingService.currentSnapshot;

    // generate position data
    const positionData = this._exchangeStreamingService.createPositionStreamData(epic, snapshots);

    // select price level depending on direction
    const level = direction === PositionDirection.BUY ? positionData.offer : positionData.bid;

    // update account balance
    const margin = await this.calculateMargin(epic, positionSize, level);
    await this.updateAccountBalanceForOpeningPosition(margin);

    // return confirmed trade dto
    return {
      timestamp: Date.now(),
      status: PositionStatusType.OPENED,
      reason: ReasonConditionEnum.SUCCESS,
      dealStatus: DealStatusType.ACCEPTED,
      epic,
      dealId: this.generateRandomId(),
      positionSize,
      direction,
      level,
      profit: null,
      profitCurrency: 'EUR'
    }
  }

  async closePosition({ epic, direction, positionSize }: IClosePositionSettings): Promise<ConfirmedTradeDTO> {
    // get current snapshots
    const snapshots = this._exchangeStreamingService.currentSnapshot;

    // generate position data
    const positionData = this._exchangeStreamingService.createPositionStreamData(epic, snapshots);

    // select price level depending on direction
    const level = direction === PositionDirection.BUY ? positionData.offer : positionData.bid;

    // calculate profit
    const { marginAmount } = await this._cacheService.getOpenPosition(epic);
    const closeMargin = await this.calculateMargin(epic, positionSize, level);
    const profit = direction === PositionDirection.SELL ? closeMargin - marginAmount : marginAmount - closeMargin;

    // update account balance
    await this.updateAccountBalanceForClosingPosition(marginAmount, profit);

    // return confirmed trade dto
    return {
      timestamp: Date.now(),
      status: PositionStatusType.FULLY_CLOSED,
      reason: ReasonConditionEnum.SUCCESS,
      dealStatus: DealStatusType.ACCEPTED,
      epic,
      dealId: this.generateRandomId(),
      positionSize,
      direction,
      level,
      profit,
      profitCurrency: 'EUR'
    }
  }

  /************
  ** ACCOUNT **
  ************/

  async setAccountDetails(initialAccountSize: number): Promise<void> {
    // set demo account details
    this._demoAccountDetails = {
      _id: BackTestDemoAccount.id,
      lastUpdated: Date.now(),
      name: BackTestDemoAccount.name,
      preferred: true,
      currency: 'EUR',
      status: AccountStatus.ENABLED,
      type: AccountType.CFD,
      balance: {
        funds: initialAccountSize,
        margin: 0,
        availableToDeal: initialAccountSize,
        profitLoss: 0
      }
    }

    // save in cache
    await this._cacheService.setAccountDetails(this._demoAccountDetails);
  }

  private async updateAccountBalanceForOpeningPosition(margin: number): Promise<void> {
    // update account balance
    this._demoAccountDetails.lastUpdated = Date.now();
    this._demoAccountDetails.balance.margin += margin;
    this._demoAccountDetails.balance.availableToDeal -= margin;

    // save in cache
    await this._cacheService.setAccountDetails(this._demoAccountDetails);
  }

  private async updateAccountBalanceForClosingPosition(openingMargin: number, positionProfit: number): Promise<void> {
    // update account balance
    this._demoAccountDetails.lastUpdated = Date.now();
    this._demoAccountDetails.balance.margin -= openingMargin;
    this._demoAccountDetails.balance.availableToDeal += openingMargin;
    this._demoAccountDetails.balance.funds += positionProfit;
    this._demoAccountDetails.balance.profitLoss += positionProfit;


    // save in cache
    await this._cacheService.setAccountDetails(this._demoAccountDetails);
  }

  async resetAccountDetails(): Promise<void> {
    // delete from cache
    await this._cacheService.deleteAccount(this._demoAccountDetails._id);

    // set demo account details to undefined
    this._demoAccountDetails = undefined;
  }

  /************
  ** HELPERS **
  ************/

  private generateRandomId() {
    const length = 15;
    return Math.random().toString(36).toUpperCase().substring(2, length+2);
  }

  private async calculateMargin(epicName: string, positionSize: number, price: number): Promise<number> {
    const { epics } = await this._cacheService.getInstrument(epicName);
    let marginAmount = 0;
    const epic = epics.find(e => e.epic === epicName);
    const marginDepositBands = epic.marginDepositBands.sort((a, b) => a.min - b.min);

    for (let i = 0; i < marginDepositBands.length; i++) {
      const { min, max, margin } = marginDepositBands[i];

      // continue if min is bigger or equal to position size
      if (min >= positionSize) continue;

      // set interval
      let interval = positionSize - min;
      if (max < positionSize) interval = max - min;

      // calculate margin
      marginAmount += interval * (margin / 100) * epic.contractSize * price * epic.baseExchangeRate;
    }

    return marginAmount;
  }
}
