export interface ImageBase {
  resourceReference: string;
  type?: string;
  imageId?: ImageId;
}

export interface Image38 extends ImageBase {
  detailsByTerritory?: ImageDetailsByTerritory[];
}

export interface Image4 extends ImageBase {
  parentalWarningType?: string;
  technicalDetails?: TechnicalImageDetails;
}

export type Image = Image38 | Image4;

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
