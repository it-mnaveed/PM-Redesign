import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PermissionsGuard } from '../_Helper/permissions.guard';
import { SaleAgreementComponent } from './sale-agreement/sale-agreement.component';
import { AgreementListingComponent } from './agreement-listing/agreement-listing.component';
import { PerformaInvoiceComponent } from './performa-invoice/performa-invoice.component';
import { OwnershipTransferComponent } from './ownership-transfer/ownership-transfer.component';
import { performaInvoicelistingComponent } from './performa-Invoice-listing/performa-Invoice-listing.component';
import { ownershiptransferlistComponent } from './ownership-transfer-list/ownership-transfer-list.component';
import { UnitDelivery } from './unit-delivery/unit-delivery.component';
import { UnitDeliveryNewComponent } from './unit-delivery-new/unit-delivery-new.component';
import { SuspensionsComponent } from './suspensions/suspensions.component';
import { SuspensionListingComponent } from './suspension-listing/suspension-listing.component';
import { unitreturnlistComponent } from './unit-return-list/unit-return-list.component';
import { unitreturnComponent } from './unit-return/unit-return.component';
import { BulkInstallmentsComponent } from './bulk-installments-posting/bulk-installments-posting.component';
import { BulkSubmittedAgreementsComponent } from './bulk-submitted-agreements/bulk-submitted-agreements.component';
import { BulkInstallmentsListComponent } from './bulk-installments-list/bulk-installments-list.component';
import { QuotationGenerationComponent } from '../renewal/quotation-generation/quotation-generation.component';
import { RevenuePopulationComponent } from '../revenue/revenue-population/revenue-population.component';
import { RevenuePostingListComponent } from '../revenue/revenue-posting-list/revenue-posting-list.component';
//Commentst
const routes: Routes = [
  { path: 'sale-agreement', component: SaleAgreementComponent, canActivate: [PermissionsGuard], data: { title: 'Agreement' } },
  { path: 'agreement-listing', component: AgreementListingComponent, canActivate: [PermissionsGuard], data: { title: 'Agreement List' } },
  { path: 'performa-invoice', component: PerformaInvoiceComponent, canActivate: [PermissionsGuard], data: { title: 'Proforma Invoice' } },
  { path: 'performa-listing', component: performaInvoicelistingComponent, canActivate: [PermissionsGuard], data: { title: 'Proforma Invoice List' } },
  { path: 'ownership-transfer', component: OwnershipTransferComponent, canActivate: [PermissionsGuard], data: { title: 'Ownership Transfer' } },
  { path: 'ownership-transfer-list', component: ownershiptransferlistComponent, canActivate: [PermissionsGuard], data: { title: 'Ownership Transfer List' } },
  { path: 'unit-delivery-list', component: UnitDelivery, canActivate: [PermissionsGuard], data: { title: 'Unit Delivery List' } },
  { path: 'unit-delivery', component: UnitDeliveryNewComponent, canActivate: [PermissionsGuard], data: { title: 'Unit Delivery' } },
  { path: 'suspension', component: SuspensionsComponent, canActivate: [PermissionsGuard], data: { title: 'Suspension' } },
  { path: 'suspension-listing', component: SuspensionListingComponent, canActivate: [PermissionsGuard], data: { title: 'Suspension Listing' } },
  { path: 'unit-return-list', component: unitreturnlistComponent, canActivate: [PermissionsGuard], data: { title: 'Unit Return List' } },
  { path: 'unit-return', component: unitreturnComponent, canActivate: [PermissionsGuard], data: { title: 'Unit Return' } },
  { path: 'bulk-installments-posting', component: BulkInstallmentsComponent, canActivate: [PermissionsGuard], data: { title: 'Bulk Installments Posting' } },
  { path: 'bulk-installments-list', component: BulkInstallmentsListComponent, canActivate: [PermissionsGuard], data: { title: 'Bulk Installments List' } },
  { path: 'bulk-submitted-agreements', component: BulkSubmittedAgreementsComponent, canActivate: [PermissionsGuard], data: { title: 'Bulk Submitted Agreements' } },
  { path: 'quotation-generation', component: QuotationGenerationComponent, canActivate: [PermissionsGuard], data: { title: 'Quotation Generation' } },
  { path: 'revenue-population', component: RevenuePopulationComponent, canActivate: [PermissionsGuard], data: { title: 'Revenue Population Off Plan' } },
  { path: 'revenue-posting-list', component: RevenuePostingListComponent, canActivate: [PermissionsGuard], data: { title: 'Revenue Posting List' } },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgreementsRoutingModule {
}
