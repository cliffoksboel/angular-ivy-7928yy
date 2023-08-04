import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager'
import { MessageBrokerService } from "./message-broker.service";
import { AccountDetailsDTO, AppSettingsDTO, CacheKey, InstrumentDTO, MessageBrokerMessage, PositionDTO } from "@project-zero/models";

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private _cacheManager: Cache,
    private readonly _messageBrokerService: MessageBrokerService,
  ) {}

  async getAppSettings(): Promise<AppSettingsDTO> {
    // get from cache
    let appSettings = await this.get<AppSettingsDTO>(CacheKey.APP_SETTINGS);

    // get from DB if not in cache
    if (!appSettings) appSettings = await this._messageBrokerService.send<AppSettingsDTO>(MessageBrokerMessage.GET_APP_SETTINGS);

    return appSettings;
  }

  async getAllOpenPositions(): Promise<PositionDTO[]> {
    // get from cache
    let openPositions = await this.get<PositionDTO[]>(CacheKey.POSITIONS);

    // get from DB if not in cache
    if (!openPositions) openPositions = await this._messageBrokerService.send<PositionDTO[]>(MessageBrokerMessage.GET_ALL_OPEN_POSITIONS);

    return openPositions;
  }

  async getOpenPosition(epic: string): Promise<PositionDTO> {
    // get from cache
    let openPosition = await this.get<PositionDTO>(CacheKey.POSITION(epic));

    // get from DB if not in cache
    if (!openPosition) openPosition = await this._messageBrokerService.send<PositionDTO>(MessageBrokerMessage.GET_OPEN_POSITION_BY_EPIC, epic);

    return openPosition;
  }

  async getInstrument(epic: string): Promise<InstrumentDTO> {
    // get from cache
    let instrument = (await this.getAll<InstrumentDTO>(CacheKey.INSTRUMENTS))
      .find(i => i.epics.findIndex(e => e.epic === epic) > -1);

    // get from DB if not in cache
    if (!instrument) instrument = await this._messageBrokerService.send<InstrumentDTO>(MessageBrokerMessage.GET_INSTRUMENT_BY_EPIC, epic);

    return instrument;
  }

  async setAccountDetails(accountDetails: AccountDetailsDTO): Promise<void> {
    // set in cache
    await this.set(CacheKey.ACCOUNT(accountDetails._id), accountDetails);
  }

  async deleteAccount(accountId: string): Promise<void> {
    // delete from cache
    await this.delete(CacheKey.ACCOUNT(accountId));
  }

  private async set(key: string, value): Promise<void> {
    await this._cacheManager.set(key, value);
  }

  private async get<T>(key: string): Promise<T> {
    return await this._cacheManager.get<T>(key);
  }

  private async delete(key: string): Promise<void> {
    await this._cacheManager.delete(key);
  }

  private async getAll<T>(key: string): Promise<Array<T>> {
    // get all keys from store
    const keys = await this._cacheManager.store.keys();

    // add all instances to return array
    const arr: T[] = [];
    for (const k in keys) {
      if (k.includes(key)) arr.push(await this.get(k));
    }

    return arr;
  }
}
