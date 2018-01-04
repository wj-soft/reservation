import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HttpHandler } from '@angular/common/http/src/backend';
import { AuthService } from '../services/auth.service';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { TemplateRef } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

interface ReservationLists {
  shopName: string;
  party: number;
  resDate: string;
  resTime: string;
  shopAddress: string;
  shopTel: string;
  shopPk: number;
  resPk: number;
  status: string;
}

interface FavoriteLists {
  pk: number;
  name: string;
  thumbnail: string;
}




@Component({
  selector: 'app-mypage',
  templateUrl: './mypage.component.html',
  styleUrls: ['./mypage.component.css']
})
export class MypageComponent implements OnInit {
  appUrl = environment.apiUrl;
  resList: any;
  favoriteList: FavoriteLists[];
  tokenInfo: string;
  mypk: string;
  myNickname = '';
  resultNickname: string;
  // 이미지처리
  form: FormGroup;
  loading = false;
  imageSrc = '../../assets/man.png';

  result; // file upload 수행 이후 서버로부터 수신한 데이터
  modalRef: BsModalRef;
  cancelComment = '';
  
  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  onInput(event) {
    this.cancelComment = event.target.value;
  }

  // 발급된 토큰을 생성함
  makeTokenInfo(){
    this.tokenInfo = this.auth.getToken();
    this.mypk = this.auth.getUserPk();
    console.log(this.mypk)
  }

  onFileChange(files: FileList) {
    if (files && files.length > 0) {
      // For Preview
      const file = files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imageSrc = reader.result;
      };
      this.avatar.setValue(file.name);
    }
  }

  onSubmit(files: FileList) {
    const headers = {
      // 'WWW-Authenticate' : 'Token',
      'Authorization': `Token ${this.tokenInfo}`
    };
    const options = {
      headers: new HttpHeaders(headers)
    };

    const formData = new FormData();
   
    formData.append('avatar', files[0]);

    const payload = {
      profile_image: files[0]
    }
  

    this.loading = true;
  
    // // 폼데이터를 서버로 전송한다.
    this.http.patch(`${this.appUrl}/accounts/${this.mypk}/profile/`, payload, options)
      .subscribe(res => console.log(res))
    //   .subscribe(res => {
    //     this.result = res;
    //     this.loading = false;
    //     this.avatar.setValue(null);
    //   });
  }

  get avatar() {
    return this.form.get('avatar');
  }

  // 닉네임변경
  changeNickname(name){
    const headers = {
      // 'WWW-Authenticate' : 'Token',
      'Authorization': `Token ${this.tokenInfo}`
    };
    console.log(headers)
    const options = {
      headers: new HttpHeaders(headers)
    };
    const payload = {
      nickname : name
    }

    this.http.patch(`${this.appUrl}/accounts/${this.mypk}/profile/`, payload, options)
      .subscribe((res : any) => {
        console.log(res)
        this.resultNickname = res.nickname;
      })
    this.modalRef.hide()
  }

  // 회원의 예약리스트가져오기
  myReservation() {
    const headers = {
      // 'WWW-Authenticate' : 'Token',
      'Authorization': `Token ${this.tokenInfo}`
    };
    const options = {
      headers: new HttpHeaders(headers)
    };
    this.http.get(`${this.appUrl}/reservations/customer/`, options)
      .subscribe((reservationList: ReservationLists[]) => {
        console.log(reservationList);
        this.resList = reservationList.map((list: any) => Object.assign({},
          {
            shopName: list.restaurant.name,
            party: list.party,
            resDate: list.information.date,
            resTime: list.information.time,
            shopAddress: list.restaurant.address,
            shopPk: list.restaurant.pk,
            resPk: list.pk,
            status: list.status
          }));
          console.log(this.resList);
      });
  }

  // 즐겨찾기 리스트 가져오기
  setFavorite() {
    const headers = {
      // 'WWW-Authenticate' : 'Token',
      'Authorization': `Token ${this.tokenInfo}`
    };
    const options = {
      headers: new HttpHeaders(headers)
    };
    this.http.get(`${this.appUrl}/reservations/favorite-toggle/`, options)
      .subscribe((favorite) => {
        this.favoriteList = favorite[0].favorites;
        // favoritelist에 index가 잡혀있음
        // console.log(favorite.favorites)
        // this.favoriteList = favorite.map((list: any) => Object.assign({},
        //   {
        //     // shopPk: favorite.favorites.pk
        //     // shopName: string
        //     // shopImage: string

        //   }))

        console.log(this.favoriteList);
      });
  }
  removeFavorite(itemPk) {
    console.log(itemPk);
    const payload = { };

    const headers = {
      // 'WWW-Authenticate' : 'Token',
      'Authorization': `Token ${this.tokenInfo}`
    };
    const options = {
      headers: new HttpHeaders(headers)
    };

    this.http.post(`${this.appUrl}/reservations/${itemPk}/favorite-toggle/`, payload, options)
      .subscribe(() => this.setFavorite());
  }

  //예약취소하기  - shopinfo로 상점의 리스트를 조회하고 그 중 예약정보 pk와 일치하는 예약정보오브젝트의 uid값을 가저온다
  //그다음은 취소요청사유와 함께 취소정보를 생성한다.
  //상태를 변경하기 위한 API를 호출한다.
  paymentCancel(shopPk, resPk) {
    console.log("shopPk", shopPk)
    console.log("resPk", resPk)
    let cancelObject: any

    //상점의 예약리스트 조회하여 취소대상을 필터
    this.http.get(`${this.appUrl}/reservations/${shopPk}/restaurant/`)
      .subscribe((resInfo: any) => {
        cancelObject = resInfo.filter(function(i){
          return i.reservation.pk == resPk
        })
        console.log(cancelObject[0].imp_uid)
        this.paymentCancle(cancelObject[0].imp_uid)
      })
  }
  paymentCancle(imp_uid) {
    this.modalRef.hide()
    const payload = {
      reason: this.cancelComment
    }
    this.http.post(`${this.appUrl}/reservations/${imp_uid}/paymentcancel/`, payload)
      .subscribe(test => {
        const payload = {
          reason: this.cancelComment
        }
        this.http.patch(`${this.appUrl}/reservations/${imp_uid}/payment/`, payload)
          .subscribe(test => console.log("!!!!", test))
      })
  }


  mypageObj: any;



  setMyInfo(){
    // XMLHttpRequest 객체의 생성
    var req = new XMLHttpRequest();
    // 동기식 처리
    const token = this.auth.getToken()
    req.open('GET', `${this.appUrl}/accounts/${this.mypk}/profile/`, false);
    req.setRequestHeader('Authorization', `Token ${this.tokenInfo}`);
    req.setRequestHeader('Content-type', 'application/json');
    // Request를 전송한다
    req.send();
    var obj = JSON.parse(req.response)
    this.mypageObj = obj
    console.log(this.mypageObj)
  }


  constructor(public http: HttpClient, public auth: AuthService, private fb: FormBuilder, private modalService: BsModalService) {
    this.form = this.fb.group({
      avatar: ['', Validators.required]
    }); 
    this.makeTokenInfo() }

  ngOnInit() {
    this.myReservation()
    this.setFavorite()
    this.setMyInfo()
    
  }

}
