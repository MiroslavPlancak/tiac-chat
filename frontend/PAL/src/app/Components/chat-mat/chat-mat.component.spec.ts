import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatMatComponent } from './chat-mat.component';

describe('ChatMatComponent', () => {
  let component: ChatMatComponent;
  let fixture: ComponentFixture<ChatMatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatMatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChatMatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
