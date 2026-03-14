export interface Deal {
  dealReference?: string;
  dealTerms: DealTerms;
  releaseReference?: string[];
}

export interface DealTerms {
  commercialModelType: string;
  useType?: string[];
  territoryCode?: string[];
  validityPeriod?: ValidityPeriod;
  priceInformation?: PriceInformation;
}

export interface ValidityPeriod {
  startDate?: string;
  endDate?: string;
}

export interface PriceInformation {
  priceType?: string;
  wholesalePricePerUnit?: number;
}
