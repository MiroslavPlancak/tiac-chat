import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicChannelsComponent } from './public-channels.component';

describe('PublicChannelsComponent', () => {
  let component: PublicChannelsComponent;
  let fixture: ComponentFixture<PublicChannelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PublicChannelsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
