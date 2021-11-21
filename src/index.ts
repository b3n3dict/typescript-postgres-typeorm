import "reflect-metadata";
import {CannotCreateEntityIdMapError, createConnection} from "typeorm";
import * as createError from 'http-errors';
import * as express from "express";
import * as bodyParser from "body-parser";
import {Request, Response} from "express";
import * as morgan from 'morgan';
import {Routes} from "./routes";
import { port } from './config';
import { validationResult } from "express-validator";

function handleError(err, _req, res, _next) {
  console.log(err)
  res.status(err.statusCode || 500).send(err.message)
}

createConnection().then(async connection => {
  const app = express();
  app.use(morgan('tiny'));
  app.use(bodyParser.json());

  Routes.forEach(route => {
    (app as any)[route.method](route.route,
      ...route.validation,
      async (req: Request, res: Response, next: Function) => {

      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw createError(400, errors.array);
        }
        const result = await (new (route.controller as any))[route.action](req, res, next);
        res.json(result);
      } catch(err) {
        next(err);
      }
    });
  });

  app.use(handleError);
  app.listen(port);

  console.log(`Express server has started on port ${port}.`);
}).catch(error => console.log(error));
