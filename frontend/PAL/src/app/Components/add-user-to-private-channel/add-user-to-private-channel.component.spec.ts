import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToPrivateChannelComponent } from './add-user-to-private-channel.component';

describe('AddUserToPrivateChannelComponent', () => {
  let component: AddUserToPrivateChannelComponent;
  let fixture: ComponentFixture<AddUserToPrivateChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddUserToPrivateChannelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUserToPrivateChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
