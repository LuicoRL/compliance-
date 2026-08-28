import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { jsPDF } from 'jspdf';
import { ComplianceRepositoryService } from '../compliance-repository.service';
import { ApplicationStatus, ComplianceApplication, ComplianceDocument, EMPTY_APPLICATION } from '../compliance.models';

@Component({
  selector: 'app-master-view', standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './master-view.component.html',
  styleUrls: ['./master-view.component.scss']
})
export class MasterViewComponent implements OnInit {
  mode: 'client' | 'admin' = 'client';
  application = EMPTY_APPLICATION();
  applications: ComplianceApplication[] = [];
  selectedApplication?: ComplianceApplication;
  searchTerm = '';
  notice = '';
  error = '';
  isSaving = false;

  readonly requiredDocuments = [
    { type: 'identity', label: 'Documento de identidad / constitución' },
    { type: 'commercial', label: 'Registro de comercio' },
    { type: 'representative-power', label: 'Poder del representante legal' },
    { type: 'bank', label: 'Certificación bancaria' }
  ];

  constructor(private readonly repository: ComplianceRepositoryService) {}

  async ngOnInit(): Promise<void> { await this.refreshApplications(); }
  get statusLabel(): string { return this.getStatusLabel(this.application.status); }
  get filteredApplications(): ComplianceApplication[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.applications;
    return this.applications.filter(item => item.clientName.toLowerCase().includes(term) ||
      item.nit.toLowerCase().includes(term) || this.getStatusLabel(item.status).toLowerCase().includes(term));
  }

  switchMode(mode: 'client' | 'admin'): void {
    this.mode = mode; this.notice = ''; this.error = '';
    if (mode === 'admin') void this.refreshApplications();
  }

  onDocumentSelected(event: Event, type: string, label: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const document: ComplianceDocument = {
      id: crypto.randomUUID(), type, fileName: file.name,
      mimeType: file.type || 'application/octet-stream', size: file.size, content: file
    };
    this.application.documents = [...this.application.documents.filter(item => item.type !== type), document];
    this.notice = `${label}: ${file.name} cargado.`;
  }

  documentName(type: string): string {
    return this.application.documents.find(item => item.type === type)?.fileName ?? '';
  }

  async submit(form: NgForm): Promise<void> {
    this.error = ''; this.notice = '';
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.error = 'Completa todos los campos obligatorios antes de enviar.';
      return;
    }
    const missing = this.requiredDocuments.filter(item => !this.documentName(item.type));
    if (missing.length) {
      this.error = `Faltan documentos: ${missing.map(item => item.label).join(', ')}.`;
      return;
    }
    this.isSaving = true;
    try {
      this.application.status = 'PENDING';
      this.application.submittedAt = new Date().toISOString();
      this.application.reportPdf = this.generateReport(this.application);
      await this.repository.save(this.application);
      await this.refreshApplications();
      this.notice = 'Solicitud enviada. El estado de tu cuenta ahora es Pendiente.';
    } catch {
      this.application.status = 'NOT_APPROVED';
      this.error = 'No se pudo guardar la solicitud. Inténtalo nuevamente.';
    } finally { this.isSaving = false; }
  }

  async approve(application: ComplianceApplication): Promise<void> {
    application.status = 'APPROVED';
    application.reviewedAt = new Date().toISOString();
    await this.repository.save(application);
    if (this.application.id === application.id) this.application = application;
    this.selectedApplication = application;
    await this.refreshApplications(false);
    this.notice = `${application.clientName} fue aprobado.`;
  }

  downloadDocument(document: ComplianceDocument): void { this.downloadBlob(document.content, document.fileName); }
  downloadReport(application: ComplianceApplication = this.application): void {
    if (application.reportPdf) this.downloadBlob(application.reportPdf, `informe-${this.safeFileName(application.clientName)}.pdf`);
  }
  resetDemo(): void { this.application = EMPTY_APPLICATION(); this.notice = ''; this.error = ''; }
  getStatusLabel(status: ApplicationStatus): string {
    return { NOT_APPROVED: 'No aprobado', PENDING: 'Pendiente', APPROVED: 'Aprobado' }[status];
  }

  private async refreshApplications(loadCurrent = true): Promise<void> {
    this.applications = await this.repository.getAll();
    if (loadCurrent && this.applications.length) this.application = this.applications[0];
  }

  private generateReport(application: ComplianceApplication): Blob {
    const pdf = new jsPDF();
    pdf.setFontSize(18); pdf.text('Informe de Cumplimiento', 20, 24); pdf.setFontSize(11);
    const rows = [
      ['Cliente', application.clientName], ['Estado', 'Pendiente'], ['NIT / TAX ID', application.nit],
      ['Constitución / CI', application.constitutionRecord], ['Registro de comercio', application.commercialRegistration],
      ['Identidad del representante', application.representativeDocument], ['Poder del representante', application.representativePower],
      ['Certificación bancaria', application.bankCertification], ['Página web / Redes', application.website || 'No proporcionado'],
      ['Fecha de envío', new Date(application.submittedAt!).toLocaleString('es-BO')]
    ];
    let y = 38;
    for (const [label, value] of rows) {
      pdf.setFont('helvetica', 'bold'); pdf.text(`${label}:`, 20, y); pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(value, 120); pdf.text(lines, 70, y); y += Math.max(9, lines.length * 6);
    }
    pdf.setFont('helvetica', 'bold'); pdf.text('Documentos adjuntos:', 20, y + 4); pdf.setFont('helvetica', 'normal');
    application.documents.forEach((item, index) => pdf.text(`• ${item.fileName}`, 24, y + 13 + index * 7));
    return pdf.output('blob');
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = fileName; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  private safeFileName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '') || 'cliente';
  }
}
