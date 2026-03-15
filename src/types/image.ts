export interface Image {
  resourceReference: string;
  type?: string;
  imageId?: ImageId;
  /** 3.8系: territory別の詳細 */
  detailsByTerritory?: ImageDetailsByTerritory[];
  /** 4系: フラット */
  parentalWarningType?: string;
  technicalDetails?: TechnicalImageDetails;
}

export interface ImageId {
  proprietaryId?: string;
  proprietaryIdNamespace?: string;
}

export interface ImageDetailsByTerritory {
  territoryCode: string[];
  parentalWarningType?: string;
  technicalDetails?: TechnicalImageDetails;
}

export interface TechnicalImageDetails {
  technicalResourceDetailsReference?: string;
  imageCodecType?: string;
  imageHeight?: number;
  imageWidth?: number;
  file?: FileDetails;
}

export interface FileDetails {
  fileName?: string;
  uri?: string;
  hashSum?: HashSum;
}

export interface HashSum {
  algorithm?: string;
  hashSumValue?: string;
}
