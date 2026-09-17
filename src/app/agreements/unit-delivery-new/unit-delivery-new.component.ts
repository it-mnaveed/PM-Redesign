import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { ConfigService } from '../../_services/LoadConfigFile';
import { DatePipe } from '@angular/common';
import { EnumService } from '../../_services/enum.service';

@Component({
  selector: 'app-unit-delivery-new',
  templateUrl: './unit-delivery-new.component.html',
  styleUrls: ['./unit-delivery-new.component.css']
})
export class UnitDeliveryNewComponent implements OnInit, AfterViewInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted: boolean = false;
  loading: boolean = false;
  isUpdate: boolean = false;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/RoleManagement/';
  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  SAPSettingList: any;
  AllowedPermissions: any;
  PermormaInvoiceLIst: any;
  AgreementList: any;
  bsInlineValue = new Date();
  datePickerConfig: any;
  activeTab: string = 'UnitDetail';
  SeriesList: any;
  SelectedAgreement: any = {};
  AgreementTypeListVlaues: any;
  ReturnCheckListMaster: any;
  U_ReturnTypeVlaues: any;
  TaxCodesList: any;
  SusmasterSelected: any;
  SelectedUnitCheckListMaster: any = [];
  SelectUnitForCheckList: any = {};
  AttachmentType: any;
  Description: any;
  FileURL: any;
  AttachmentsList: any = [];
  AttachmentTypeListValues: any;
  SeriesName: any;
  @Output() saved: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private configService: ConfigService,
    private datePipe: DatePipe,
    private enumService: EnumService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
  }


  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
  }

  ngOnDestroy(): void {
    // ✅ Prevent memory leaks
    this.dtTrigger.unsubscribe();
  }
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }
  ngOnInit(): void {
    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();


    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
      this.AgreementTypeListVlaues = this.AgreementTypeListVlaues.filter(
        (item: any) => item.fieldValue != 3
      );
    });

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true
    };

    this.form = this.formBuilder.group({
      Id: [0],                               // int – PK
      Name: [''],                            // string?
      U_Seri: ['', Validators.required],                           // string?
      U_DocNum: [''],                         // string?
      U_AGID: [null, Validators.required],                         // int?
      U_PDate: [new Date()],                        // DateTime?
      u_TerDate: [new Date(),],                      // DateTime?
      u_Status: [''],                      // int?
      u_SecAmt: [null],                    // decimal?
      u_DmgDeductAmt: [null],                       // decimal?                      
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],                      // int?
      CreatedDate: [null],                    // DateTime?
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],                      // int?
      UpdatedDate: [null],
      // DocumentLines is a collection -> use FormArray for child rows
      DocumentLines: [],//this.formBuilder.array([])        // PMN_OUSSP1[]
      AgreementType: ['', Validators.required],
      U_BPCode: [''],
      U_BPName: [''],
      U_CPName: [''],
      U_CustRefNo: [''],
      U_DocDate: [new Date()],

    });
    // this.GetPermormaInvoiceLIst();
    this.GetLovs();
    this.GetMasterData();

    if (history.state && history.state.forward) {

      let agTypeText = 2;
      debugger
      switch (history.state.forward.data.u_AGType) {
        case 'Sales':
          agTypeText = 1;
          break;
        case 'Rental':
          agTypeText = 2;
          break;

        default:
          agTypeText = 2;
      }
      this.onDropDownChange(agTypeText, "AgreementType")
      this.GetDocSeries(agTypeText)

    }
  }

  get f() { return this.form.controls; }
  onSubmit() {
    
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    const payload = { ...this.form.value };
    payload.U_DocNum = String(payload.U_DocNum ?? '')
    payload.U_Seri = String(payload.U_Seri ?? '')

    

    const items = this.SelectedAgreement.agreementItems.filter((unit: any) => unit.isSelected);
    if (items.length == 0) {
      this.toastr.warning("Please Select Units!", "Required", {
        progressBar: true,
        closeButton: true
      });
      return
    }

    // items already filtered by isSelected units
    const agreementItems = items.map((unit: any) => {
      return {
        // ---------- PMN_OUSSP0 fields ----------
        // these match your backend model property names

        Name: unit.u_UnitName,
        u_AgrItmId: unit.agrItemId,
        CreatedBy: unit.createdBy,
        CreatedDate: unit.createdDate,
        UpdatedBy: unit.updatedBy,
        UpdatedDate: unit.updatedDate,

        // ---------- PMN_OUSSP1 collection ----------
        CheckListItems: unit.checkListMaster
          .filter((chk: any) => chk.isSelected)   // only selected checklists
          .map((chk: any) => ({
            Name: chk.name,
            u_DeliveryItem: chk.id,        // or whatever field represents suspension ID
            U_Flag: chk.isSelected ? 'Y' : 'N', // optional if backend needs a char flag
            CreatedBy: chk.createdBy,
            CreatedDate: chk.createdDate,
            UpdatedBy: chk.updatedBy,
            UpdatedDate: chk.updatedDate
          }))
      };
    });

    payload.AgreementItems = agreementItems;
    payload.Attachments = this.AttachmentsList;


    let url = '/UnitDelivery/postunitDelivery';
    this._service.Post(payload, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          try { this.saved.emit(true); } catch (e) {}

        } else {
          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => {

      },
    });
  }

  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset();
    this.AttachmentsList = [];
    this.SelectedAgreement = {}
    this.form.patchValue({
      Id: 0,
      CreatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      CreatedDate: new Date(),
      UpdatedDate: new Date(),
      U_PDate: new Date()

    });
  }

  GetAgreementFilterList(Id: any = 0) {

    let url = '/Agreement/agreements?agrType=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          if (Id > 0) {
            if (result.data.length > 0) {
              this.SelectedAgreement = result.data[0];
            } else {
              this.SelectedAgreement = {};
            }

          }
          this.AgreementList = result.data.filter((item: any) => item.approvalStatus === 'Approved');

          if (history.state && history.state.forward) {

            this.GetunitList(history.state.forward.data);
          }
          // this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  GetAgreementdetailstList(Id: any = 0, lineItems: any[] = []) {

    let url = '/Agreement/agreementDetailforSubDocumentbyAgrid?agrId=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {

            this.SelectedAgreement = result.data[0];

            if (this.SelectedAgreement?.agreementItems?.length) {
              this.SelectedAgreement.agreementItems.forEach((agreementItem: any) => {

                // Find matching lineItem
                const matchedLineItem = lineItems?.find(
                  (li: any) => li.u_AgrItmId === agreementItem.agrItemId
                );

                // Mark agreement item as selected if matched
                if (matchedLineItem) {
                  agreementItem.isSelected = true;
                }

                // Build checkListMaster from ReturnCheckListMaster
                agreementItem.checkListMaster = (this.ReturnCheckListMaster || []).map((item: any) => {
                  // See if item exists in agreement’s old checklist
                  const existing = agreementItem.checkListMaster?.find((x: any) => x.id === item.id);

                  // See if item exists in lineItem’s checklist
                  const lineChecklist = matchedLineItem?.checklist?.find(
                    (chk: any) => chk.chkItemID === item.id
                  );

                  return {
                    ...item,
                    isSelected: lineChecklist
                      ? lineChecklist.flag === "Y"
                      : existing?.isSelected ?? false
                  };
                });
              });
            }
          }


        }
      },
      error: (err: any) => { },
    });
  }
  onDropdownChange(data: any, DDType: any, lineItems: any[] = []) {

    if (DDType == 'Agreements') {
      let exist = this.AgreementList.find((m: any) => m.id == data);
      this.GetAgreementdetailstList(data, lineItems);
      if (exist) {
        let agTypeText = '';

        switch (exist.u_AGType) {
          case 1:
            agTypeText = 'Sale';
            break;
          case 2:
            agTypeText = 'Rent';
            break;
          case 3:
            agTypeText = 'Maintenance';
            break;
          case 5:
            agTypeText = 'Off Plan';
            break;
          default:
            agTypeText = '';
        }

        this.form.patchValue({
          AgreementType: agTypeText,
          U_BPCode: exist.u_BPCode,
          U_BPName: exist.name,
          U_CPName: exist.u_CPName,
          U_CustRefNo: exist.u_CustRefNo,
          // U_Seri: null,
          U_Stauts: exist.status,
          U_InstID: null,
          inst_Perc: null,
          inst_HGDate: '',
          inst_Date: '',
          inst_ARDP: '',
          inst_AmountBeforeTax: null,
          inst_Tax: null,
          inst_AmountAfterTax: null,
          inst_AmountReceived: null,
          // U_DocNum: exist.u_DocNum
        });

        //  this.GetDocSeries(exist.u_AGType);

      }
    }
    if (DDType === 'Series') {
      
      let exist = this.SeriesList.find((m: any) => m.id == data);
      if (exist) {
        this.form.controls['U_DocNum'].setValue(exist.u_SNext)
      }
    }
    if (DDType === 'Installments') {
      let exist = this.SelectedAgreement.agreementInstallments.find((m: any) => m.id == data);
      if (exist) {

        this.form.patchValue({
          inst_Perc: 100,
          inst_HGDate: this.datePipe.transform(exist.u_HDate, 'dd-MM-yyyy'),
          inst_Date: this.datePipe.transform(exist.u_GDate, 'dd-MM-yyyy'),
          inst_ARDP: '',
          inst_AmountBeforeTax: exist.u_AmtBeforeTax,
          inst_Tax: exist.u_Tax,
          inst_AmountAfterTax: exist.u_AmtAfterTax,
          inst_AmountReceived: exist.u_AmtAfterTax,
        });
      }
    }
  }
  switchTab(tabName: string, tabType: string) {
    if (tabType == 'header') {
      this.activeTab = tabName;
    }

  }
  GetDocSeries(agrId: any) {
    let url = `/MasterData/GetDocSeries?agrmntId=${agrId}&docType=4`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SeriesList = result.data;
        }
      },
      error: (err: any) => { },
    });
  }
  GetLovs() {

    let url = '/MasterData/GetLovs?Form=Return';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          // this.AgreementTypeListVlaues = result.data.filter(
          //   (item: any) => item.field === 'AgreementType' && item.fieldValue != 3
          // );
          this.U_ReturnTypeVlaues = result.data.filter((item: any) => item.field === 'ReturnType');
          this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        }
      },
      error: (err: any) => { },
    });
  }

  onDropDownChange(data: any, form: any) {
    if (form === 'AgreementType') {
      
      this.AgreementList = [];
      this.form.patchValue({
        U_Seri: null,
        U_AGID: null,
        U_DocNum: ''
      })
      this.GetAgreementFilterList(data);
      let exist = this.AgreementTypeListVlaues.find((m: any) => m.fieldValue == data);
      if (exist) {
        this.GetDocSeries(exist.fieldValue)

      }
    }
  }
  GetMasterData() {

    let url = '/MasterData/GetMasterData?type=CheckList';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.ReturnCheckListMaster = result.data.filter((item: any) => item.type === 'Delivery'); result.data;

        }
      },
      error: (err: any) => { },
    });
  }
  masterSelected = false;   // for the header checkbox

  // Triggered when header checkbox changes
  toggleAll(type: any = '') {
    if (type) {
      
      this.SelectUnitForCheckList.checkListMaster.forEach((r: any) => r.isSelected = this.SelectUnitForCheckList.SusmasterSelected);
    } else {
      this.SelectedAgreement.agreementItems.forEach((r: any) => r.isSelected = this.masterSelected);
    }

  }
  // Triggered when a single row checkbox changes
  checkIfAllSelected() {
    this.masterSelected = this.SelectedAgreement.agreementItems.every((r: any) => r.isSelected);
  }
  AddCheckListMaster(SelectedUnit: any) {
    
    this.SelectUnitForCheckList = SelectedUnit;
    this.SelectUnitForCheckList.SusmasterSelected = this.SelectUnitForCheckList.SusmasterSelected;
    ($('#CheckListMasterModal') as any).modal('show');
  }
  AddRemoveAttachments(action: any, postdata: any) {

    if (action === 'add') {
      if (!this.AttachmentType || !this.Description || !this.FileURL) {
        this.toastr.warning("All fields are required", "Warning");
        return;
      }
      let data = {
        attachmentType: this.AttachmentType,
        description: this.Description,
        filePath: this.FileURL,
        FileURL2: this.FileURL,
        documentType: 'Suspension',
        createdBy: parseInt(this.CurrentUserInfo.Id)
      }

      if (data.filePath) {
        this.AttachmentsList.push(data);
        this.AttachmentType = "";
        this.Description = "";
        this.FileURL = "";
        data.documentType = '';
      }


    } else {
      this.AttachmentsList = this.AttachmentsList.filter((item: any) => item !== postdata);
    }
  }
  async onFileChange(event: any, fileInputRef: HTMLInputElement) {
    const base64: any = await this._sharedHelper.preview(event.target.files, 'image');
    if (base64) {
      this.FileURL = base64; // Optional: For <img [src]="previewImage">
    } else {
      this.toastr.error("Invalid file. Only JPG/PNG under 10MB allowed.");
      if (fileInputRef) fileInputRef.value = '';
    }
  }
  GetunitList(data: any) {
    this.SeriesName = data.u_SeriesName;
    this.AttachmentsList = data.attachments

    //this.onDropDownChange(data.u_AGID, "AgreementType")
    this.onDropdownChange(data.u_AGID, "Agreements", data.lineItems)

    this.form.patchValue({
      Id: data.id,
      Name: data.name,
      U_Seri: data.u_Seri,
      U_DocNum: data.u_DocNum,
      U_AGID: data.u_AGID,



    });


  }
}