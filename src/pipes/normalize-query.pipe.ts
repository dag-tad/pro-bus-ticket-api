import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NormalizeQueryPipe implements PipeTransform {
  transform(value: any) {
    if (value?.search === 'undefined' || value?.search === 'null') {
      value.search = undefined;
    }

    value.page = value?.page ?? 1;
    value.limit = value?.limit ?? 10;
    value.sortBy = value?.sortBy ?? ''
    value.sortOrder = value?.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    if (typeof value.search === 'string') {
      const trimmed = value.search.trim();
      value.search = trimmed ? trimmed : undefined;
    }

    return value;
  }
}