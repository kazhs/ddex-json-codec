export interface ReleaseDeal {
  dealReleaseReferences: string[];
  deals: Deal[];
  effectiveDate?: string;
}

export interface Deal {
  dealReference?: string;
  dealTerms: DealTerms;
}

export interface DealTerms {
  commercialModelType?: string;
  /** 3.8系: Usage > UseType[] */
  usage?: Usage;
  /** 4系: UseType[] 直下 */
  useTypes?: string[];
  territoryCode?: string[];
  validityPeriod?: ValidityPeriod;
  priceInformation?: PriceInformation;
  takeDown?: boolean;
}

export interface Usage {
  useTypes: string[];
}

export interface ValidityPeriod {
  startDate?: string;
  endDate?: string;
}

export interface PriceInformation {
  priceType?: string;
  wholesalePricePerUnit?: number;
}
