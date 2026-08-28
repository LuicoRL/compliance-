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
});
