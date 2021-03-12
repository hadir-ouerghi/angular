import { Component, OnInit, ViewChild, Inject} from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import {Comment} from '../shared/comment';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {MatSliderModule} from '@angular/material/slider';
import { visibility, flyInOut, expand } from '../animations/app.animation';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  // tslint:disable-next-line:use-host-property-decorator
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
    },
  animations: [
    flyInOut(),
    visibility(),
    expand()

  ]

})
export class DishdetailComponent implements OnInit {
  @ViewChild('fform') commentFormDirective;

  myModel: 1;
  commentForm: FormGroup;
  comment: Comment;
    dish : Dish;
    errMess: string;
    dishcopy: Dish;
    visibility = 'shown';



    dishIds: string[];
    prev: string;
    next: string;
    
    formErrors = {
      'author': '',
      'comment': ''
    };
  
    validationMessages = {
      'author': {
        'required':      'Name is required.',
        'minlength':     'Name must be at least 2 characters long.'
      },
      'comment': {
        'required':      'Comment is required.'
      },
      
    };

    constructor(private dishservice: DishService,
      private route: ActivatedRoute,
      private location: Location,
      private cm: FormBuilder,
      @Inject('BaseURL') public BaseURL) {    
        this.createForm();
      }
  
      ngOnInit() {
        this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
        this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(+params['id']); }))
        .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
        errmess => this.errMess = <any>errmess);
      }
    
      setPrevNext(dishId: string) {
        const index = this.dishIds.indexOf(dishId);
        this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
        this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
      }
  
    goBack(): void {
      this.location.back();
    }
    createForm() {
      this.commentForm = this.cm.group({
        author: ['', [Validators.required, Validators.minLength(2)] ],
        rating: 5,
        comment: ['', [Validators.required] ],
        
      });
      this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

      this.onValueChanged(); // (re)set validation messages now
    }

    onValueChanged(data?: any) {
      if (!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        if (this.formErrors.hasOwnProperty(field)) {
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if (control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              if (control.errors.hasOwnProperty(key)) {
                this.formErrors[field] += messages[key] + ' ';
              }
            }
          }
        }
      }
    }
  
  
    onSubmit() {
      this.comment = this.commentForm.value;
      this.comment.date = new Date().toISOString();
      console.log(this.comment);
      this.dishcopy.comments.push(this.comment);
      this.dishservice.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
      this.commentForm.reset({
        author: '',
        rating: 5,
        comment: ''
      });
      this.commentFormDirective.resetForm();      
    }
  
  
}
