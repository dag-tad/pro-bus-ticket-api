import { Injectable, NestMiddleware, Search } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PaginateMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {

    const normalizedSearch =
      typeof req.query.search === 'string' &&
      req.query.search.trim() !== '' &&
      req.query.search !== 'undefined' &&
      req.query.search !== 'null'
        ? req.query.search.trim()
        : undefined;

        if (normalizedSearch) {
            req.query = {
                ...req.query,
                search: normalizedSearch
            }
        }
    
    next();
  }
}
