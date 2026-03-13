import { Router } from "express";
import * as api from "./user.controller.js";
import * as v from "./user.validator.js";
import * as web from "./users.app.controller.js";
import { asyncHandler } from "../../core/errors/error-utils.js";

const router = Router();

// EJS routes
router.get("/app", web.withFlash, web.requireWebAuth, asyncHandler(web.getAppHome));
router.get("/app/login", web.withFlash, web.redirectIfAuthenticated, asyncHandler(web.getAppLogin));
router.post(
	"/app/login",
	web.redirectIfAuthenticated,
	v.appLoginValidator,
	v.validateWebRequest("/users/app/login"),
	asyncHandler(web.postAppLogin)
);
router.get("/app/register", web.withFlash, web.redirectIfAuthenticated, asyncHandler(web.getAppRegister));
router.post(
	"/app/register",
	web.redirectIfAuthenticated,
	v.appRegisterValidator,
	v.validateWebRequest("/users/app/register"),
	asyncHandler(web.postAppRegister)
);
router.post("/app/logout", asyncHandler(web.postAppLogout));

// API routes
router.get("/", asyncHandler(api.getUsers));
router.post("/signin", v.signInValidator, v.validateRequest, asyncHandler(api.signIn));
router.post("/login", v.loginValidator, v.validateRequest, asyncHandler(api.login));
router.post("/refresh", v.refreshSessionValidator, v.validateRequest, asyncHandler(api.refreshSession));
router.post("/logout", v.logoutValidator, v.validateRequest, asyncHandler(api.logout));
router.get("/:id", v.userIdValidator, v.validateRequest, asyncHandler(api.getUser));
router.post("/", v.createUserValidator, v.validateRequest, asyncHandler(api.postUser));
router.patch("/:id", v.updateUserValidator, v.validateRequest, asyncHandler(api.patchUser));
router.delete("/:id", v.userIdValidator, v.validateRequest, asyncHandler(api.removeUser));

export default router;
