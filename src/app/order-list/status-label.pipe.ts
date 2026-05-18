import { Pipe, PipeTransform } from '@angular/core';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  DISPATCHED: 'Dispatched',
  PARTIALLY_DISPATCHED: 'Partially Dispatched',
  MANUALLY_DISPATCHED: 'Manually Dispatched',
};

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string): string {
    return STATUS_LABELS[value] ?? value;
  }
}
