import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplianceRepositoryService } from '../compliance-repository.service';
import { MasterViewComponent } from './master-view.component';

describe('MasterViewComponent', () => {
  let component: MasterViewComponent;
  let fixture: ComponentFixture<MasterViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterViewComponent],
      providers: [{
        provide: ComplianceRepositoryService,
        useValue: { getAll: () => Promise.resolve([]), save: () => Promise.resolve() }
      }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the client pending when follow-up forms are enabled', async () => {
    component.application.status = 'PENDING';
    component.application.baseDocumentationReviewed = true;

    await component.setFollowUpEligibility(component.application, true);

    expect(component.application.status).toBe('PENDING');
    expect(component.application.followUpFormsEnabled).toBe(true);
  });

  it('requires applicable follow-up forms before final approval', () => {
    component.application.status = 'PENDING';
    component.application.baseDocumentationReviewed = true;
    component.application.followUpFormsEnabled = true;

    expect(component.canApprove(component.application)).toBe(false);
    component.application.followUpFormsSubmittedAt = new Date().toISOString();
    expect(component.canApprove(component.application)).toBe(true);
  });
});
