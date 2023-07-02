import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Stripe } from 'stripe'

export class UserPaymentAddress {
  @ApiProperty()
  @IsString()
  @MaxLength(2)
  country: string

  @ApiProperty()
  @IsString()
  state: string

  @ApiProperty()
  @IsString()
  city: string

  @ApiProperty()
  @IsString()
  line1: string

  @ApiProperty()
  @IsString()
  line2: string

  @ApiProperty()
  @IsString()
  postal_code: string

  constructor() {
    this.country = '';
    this.state = '';
    this.city = '';
    this.line1 = '';
    this.line2 = '';
    this.postal_code = '';
  }
}

class UserDataTaxIdsApiModel {
  @ApiProperty({
    description: 'Company taxId type',
    enum: [
      'ae_trn',
      'au_abn',
      'au_arn',
      'bg_uic',
      'br_cnpj',
      'br_cpf',
      'ca_bn',
      'ca_gst_hst',
      'ca_pst_bc',
      'ca_pst_mb',
      'ca_pst_sk',
      'ca_qst',
      'ch_vat',
      'cl_tin',
      'eg_tin',
      'es_cif',
      'eu_oss_vat',
      'eu_vat',
      'gb_vat',
      'ge_vat',
      'hk_br',
      'hu_tin',
      'id_npwp',
      'il_vat',
      'in_gst',
      'is_vat',
      'jp_cn',
      'jp_rn',
      'jp_trn',
      'ke_pin',
      'kr_brn',
      'li_uid',
      'mx_rfc',
      'my_frp',
      'my_itn',
      'my_sst',
      'no_vat',
      'nz_gst',
      'ph_tin',
      'ru_inn',
      'ru_kpp',
      'sa_vat',
      'sg_gst',
      'sg_uen',
      'si_tin',
      'th_vat',
      'tr_tin',
      'tw_vat',
      'ua_vat',
      'unknown',
      'us_ein',
      'za_vat',
    ], // Stripe.TaxId.Type
  })
  @IsString()
  type: Stripe.TaxId.Type

  @ApiProperty({ description: 'Company taxId value' })
  @IsString()
  value: string

  constructor() {
    this.type = 'unknown';
    this.value = '';
  }
}

export class UserDataApiModel {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string

  @ApiProperty()
  @ValidateNested()
  @Type(() => UserPaymentAddress)
  address: UserPaymentAddress

  @ApiProperty({
    description: 'Company taxIds',
    type: UserDataTaxIdsApiModel,
    isArray: true,
  })
  @IsArray()
  taxIds: Array<UserDataTaxIdsApiModel>

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
    this.address = new UserPaymentAddress();
    this.taxIds = [];
  }
}
