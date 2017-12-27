import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Headers, RequestOptions } from '@angular/http';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Reply, Result, Author, Profile } from '../models/reply';
import { forEach } from '@angular/router/src/utils/collection';
import { AuthService } from '../services/auth.service';
import { Event } from '@angular/router/src/events';


@Component({
  selector: 'app-reply',
  templateUrl: './reply.component.html',
  styleUrls: ['./reply.component.css']
})
export class ReplyComponent implements OnInit {
   comment: Result[];
   profile: Profile[];
   profile2: string;
   patchUrl = 'http://api.booki.kr/restaurants/comments';
   removeUrl = 'http://api.booki.kr/restaurants/comments';
   //  ?page=6
   getUrl = 'http://api.booki.kr/restaurants/1/comments/';
   appUrl = 'http://api.booki.kr/accounts/signup/';
   title = 'Review';
   rate = 0;
   // rating 애니메이션
   y: number;
   count1; count2; count3; count4 = 0;
   eventStorage = [];
   cntAll = 0;
   evt = new KeyboardEvent('keyup');
   isActivated = false;
   iconDeactivated = false;
   inputText = '';
   patchRate: number;
   patchedRate: FormGroup;
   startingIndex = 0;
   endIndex = 3;
   itemsPerPage = 5;
   totalItems = 30;
   currentPage = 1;
   txtvalue: string;

  constructor(public http: HttpClient, public fb: FormBuilder, private auth: AuthService) {
    this.getcomments();
  }

  onKeyup(com, val: string, rate: number) {
    console.log(com);
  }

  getcomments() {
    this.http.get(this.getUrl)
    .subscribe( ( comm: Reply )  =>  {
      this.comment = comm.results;
      // this.sliceTotalComments();
      this.countAll(comm);
      this.countRating();
      console.log(this.count2);
    });
  }

  checkPage(pg: any) {
    console.log(pg);
    console.log('[page number]', pg.page);
    this.http.get(`${this.getUrl}?page=${pg.page}`)
    .subscribe( (comm: Reply) => {
      this.comment = comm.results;
    });
  }

  // sliceTotalComments() {
  //   배열 slice
  //   this.comment = this.comment.slice(this.startingIndex, this.itemsPerPage);
  //   console.log('[slice result]', this.comment);
  //   this.startingIndex = this.itemsPerPage;
  //   this.endIndex = this.endIndex + 3;
  //   console.log('[starting index change check]', this.startingIndex);
  //   console.log('[end index change check]', this.itemsPerPage);
  //   return this.comment;
  //   1페이지 인덱스 : 0,3 2페이지 : 3, 6, 3페이지 : 6, 10
  // }

  countRating() {
    // nothing
    this.count1 = this.comment.filter(comm => comm.star_rate <= 2).length;
    this.count2 = this.comment.filter(comm => comm.star_rate > 2 && comm.star_rate <= 3).length;
    this.count3 = this.comment.filter(comm => comm.star_rate > 3 && comm.star_rate <= 4).length;
    this.count4 = this.comment.filter(comm => comm.star_rate > 4 && comm.star_rate <= 5).length;
  }

  countAll(com: Reply) {
    this.cntAll = com ? com.count : 0;
  }

  getPatchedrate(evt) {
    this.patchRate = evt.target.id;
  }

  dd(txt) {
    return '';
  }

  returnval() {
    console.log('마우스아웃');
    this.isActivated = !this.isActivated;
  }

  postComments(txt, val: string, rate: number, event: KeyboardEvent) {
    console.dir(event);
      // 코멘트, 별점 미입력 방지
      // '별점을 등록해주세요!' 애니메이션
      // 엔터키 누르는 이벤트 확인
      if (rate === 0) {
        console.log('plz add a star rate');
        return '';
      }

      const payload = {
        comment: val,
        star_rate: this.rate,
      };

      const headers = {
        // 'WWW-Authenticate': 'Token',
        'Authorization': 'Token bfec561d6317ab26bb0cb6ddb1fa662871be4f6b'
      };

      const options = {
        headers : new HttpHeaders(headers)
      };

      console.log('header확인', options);
      ( payload && rate !== 0 && event.key === 'Enter') ?
      this.http.post(this.getUrl, payload, options)
      .subscribe ( (res: any) => {
        this.txtvalue = '';
        this.getcomments();
        console.log('profile', this.profile);
        console.log('post 체크', res);
      }) : console.log('error. sth wrong');
  }

  checkCount(starVal: number) {
    this.rate = starVal;
    console.log('별점', this.rate);
  }

  // remove
  removeComm(td: number) {

    console.log('[td]', td);
    const headers = {
      // 'WWW-Authenticate': 'Token',
      'Authorization': 'Token bfec561d6317ab26bb0cb6ddb1fa662871be4f6b'
    };
    const options = {
      headers : new HttpHeaders(headers)
    };
    console.log('header확인', options);


    this.http.delete(`${this.removeUrl}/${td}/`, options)
    .subscribe((res) => {
      this.getcomments();
    console.log('deleted!');
    });
  }
  // restaurant 프로퍼티 pk값 저장

  // 클래스 바인딩 실행 함수
  changeAct(pk, rm) {
    const userPk = this.auth.getUserPk();

    // author.pk와 로그인한 유저의 pk비교로 권한 확인
    if ( pk === userPk) {
    this.isActivated = !this.isActivated;
    this.iconDeactivated = !this.iconDeactivated;
    } else {
      alert('권한이 없습니다');
    }
  }

  // patch
  patchComm(pk: number, comm: any) {
    // 페이로드
    const payload = {
      comment : comm.value,
      star_rate : this.patchRate
    };

    // HTTP헤더
    const headers = {
      // 'WWW-Authenticate': 'Token',
      'Authorization': 'Token bfec561d6317ab26bb0cb6ddb1fa662871be4f6b'
    };
    const options = {
      headers : new HttpHeaders(headers)
    };

    this.http.patch(`${this.patchUrl}/${pk}/`, payload, options)
    .subscribe(( res ) => {
      console.log('patch result', res);
      this.getcomments();
    });
  }

  patchRating(event: any) {
    console.dir(event);
  }

  // css용 editMode 클래스 제거
  removeEditMode() {
    console.log('edited');
    this.isActivated = !(this.isActivated);
  }

  onBoundsChanged(event) {
      console.log(event);
    }


  ngOnInit() {
    this.patchedRate = this.fb.group ({
      rateOne: ['1'],
      rateTwo: ['2'],
      rateThree: ['3'],
      rateFour: ['4'],
      rateFive: ['5'],
    });
  }

}

