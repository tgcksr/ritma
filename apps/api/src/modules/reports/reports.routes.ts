import type { FastifyPluginAsync } from 'fastify';
import type { ReportQuery } from '@ritma/shared';
import { reportsService } from './reports.service';

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/summary', async (request) => reportsService.summary(request.query as ReportQuery));
};
