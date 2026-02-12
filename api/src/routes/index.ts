import { Router } from "express";

import { componentsRouter } from "./components.routes";
import { depreciationRouter } from "./depreciation.routes";
import { periodsRouter } from "./periods.routes";

export const apiRouter = Router();

apiRouter.use(componentsRouter);
apiRouter.use(depreciationRouter);
apiRouter.use(periodsRouter);
