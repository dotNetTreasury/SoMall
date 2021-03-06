import { Component, OnInit, Input, ViewChild, Injector, ElementRef } from '@angular/core';
import { VisitorShopCreateOrEditDto, OssProxyService } from 'src/api/appService';
import { NgForm } from '@angular/forms';
import base64 from '@core/utils/base64';
import { UploadXHRArgs } from 'ng-zorro-antd';
import { HttpRequest, HttpEvent, HttpEventType, HttpResponse, HttpClient } from '@angular/common/http';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import * as DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
@Component({
  selector: 'app-shop-edit',
  templateUrl: './shop-edit.component.html',
  styleUrls: ['./shop-edit.component.scss']
})
export class ShopEditComponent implements OnInit {

  //public Editor = ClassicEditor;

  public Editor = DecoupledEditor;

  public onReady( editor ) {
      editor.ui.getEditableElement().parentElement.insertBefore(
          editor.ui.view.toolbar.element,
          editor.ui.getEditableElement()
      );
  }



  @ViewChild('f', { static: true }) f: NgForm;

  @Input() title: string;

  @Input() id: string;

  @Input() form: VisitorShopCreateOrEditDto;

  i: any = {};

  uploadData: any = {};
  operator = "somall";
  bucket: string = "ttwork";

  action: string = "https://v0.api.upyun.com/ttwork"

  private ossApi: OssProxyService;
  constructor(private injector: Injector, private http: HttpClient) {
  }

  ngOnInit() {
    this.ossApi = this.injector.get(OssProxyService);
  }


  customReq = (item: UploadXHRArgs) => {
    console.log(this.bucket);
    // @ts-ignore
    var date = new Date().toGMTString();

    var opts = {
      "save-key": "/somall/{year}/{mon}/{day}/upload_{random32}{.suffix}",
      bucket: this.bucket,
      expiration: Math.round(new Date().getTime() / 1000) + 3600,
      date: date
    };

    var policy = base64.encode(JSON.stringify(opts));
    var data = ["POST", "/" + this.bucket, date, policy].join("&");

    return this.ossApi.getSignature({ data: data }).subscribe(res => {
      console.log(res);
      // Create a FormData here to store files and other parameters.
      const formData = new FormData();
      // tslint:disable-next-line:no-any
      formData.append('file', item.file.name);
      formData.append('file', item.file as any);
      formData.append('authorization', `UPYUN ${this.operator}:${res.signature}`);
      formData.append('policy', policy);

      const req = new HttpRequest('POST', item.action!, formData, {
        reportProgress: true,
        withCredentials: false
      });
      // Always returns a `Subscription` object. nz-upload would automatically unsubscribe it at correct time.
      return this.http.request(req).subscribe(
        // tslint:disable-next-line no-any
        (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress) {
            if (event.total! > 0) {
              // tslint:disable-next-line:no-any
              (event as any).percent = (event.loaded / event.total!) * 100;
            }
            item.onProgress!(event, item.file!);
          } else if (event instanceof HttpResponse) {
            item.onSuccess!(event.body, item.file!, event);
          }
        },
        err => {
          item.onError!(err, item.file!);
        }
      );
    });
  };


  handleChange(e) {
    console.log(e);
    if (e.type === "success") {
      const url = e.file.response.url;
      this.form.coverImage = `http://img.somall.top${url}!w500`
    }

  }

  handleChange2(e) {
    console.log(e);
    if (e.type === "success") {
      const url = e.file.response.url;
      this.form.logoImage = `http://img.somall.top${url}!w500`
    }

  }

  onSubmit(f: NgForm) { }

  ngOnDestroy(): void {
  };

}
