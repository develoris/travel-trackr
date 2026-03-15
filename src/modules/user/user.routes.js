import { Router } from "express";
import * as api from "./user.controller.js";
import * as v from "./user.validator.js";
import * as web from "./users.app.controller.js";
import { asyncHandler } from "../../core/errors/error-utils.js";

const router = Router();

// EJS routes
router.get("/app", web.withFlash, web.requireWebAuth, web.requirePasswordUpdate, asyncHandler(web.getAppHome));
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
router.get(
	"/app/profile",
	web.withFlash,
	web.requireWebAuth,
	asyncHandler(web.getAppProfile)
);
router.post(
	"/app/profile/password",
	web.requireWebAuth,
	v.appProfilePasswordValidator,
	v.validateWebRequest("/users/app/profile"),
	asyncHandler(web.postAppProfilePassword)
);
router.get(
	"/app/admin/users",
	web.withFlash,
	web.requireWebAuth,
	web.requirePasswordUpdate,
	web.requireAdminWeb,
	asyncHandler(web.getAppAdminUsers)
);
router.post(
	"/app/admin/users",
	web.requireWebAuth,
	web.requirePasswordUpdate,
	web.requireAdminWeb,
	v.appAdminCreateUserValidator,
	v.validateWebRequest("/users/app/admin/users"),
	asyncHandler(web.postAppAdminCreateUser)
);
router.post(
	"/app/admin/users/:id/block",
	web.requireWebAuth,
	web.requirePasswordUpdate,
	web.requireAdminWeb,
	v.appAdminUserActionValidator,
	v.validateWebRequest("/users/app/admin/users"),
	asyncHandler(web.postAppAdminBlockUser)
);
router.post(
	"/app/admin/users/:id/unblock",
	web.requireWebAuth,
	web.requirePasswordUpdate,
	web.requireAdminWeb,
	v.appAdminUserActionValidator,
	v.validateWebRequest("/users/app/admin/users"),
	asyncHandler(web.postAppAdminUnblockUser)
);
router.post(
	"/app/admin/users/:id/delete",
	web.requireWebAuth,
	web.requirePasswordUpdate,
	web.requireAdminWeb,
	v.appAdminUserActionValidator,
	v.validateWebRequest("/users/app/admin/users"),
	asyncHandler(web.postAppAdminDeleteUser)
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
