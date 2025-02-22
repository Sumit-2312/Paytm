"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const { users } = require('../src/db');
const auth_1 = __importDefault(require("../src/auth"));
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, password } = req.body;
    const user = yield users.findOne({ firstName, lastName, password });
    if (user) {
        res.send("User already exists").status(400);
        return;
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const newUser = users.create({
        firstName,
        lastName,
        password: hashedPassword
    });
    res.send(newUser).status(200);
    return;
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, password } = req.body;
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const user = users.findOne({ firstName, lastName, hashedPassword });
    if (!user) {
        res.json({
            message: "please signup first",
        }).status(400);
        return;
    }
    const token = jsonwebtoken_1.default.sign({ firstName, lastName }, "Secret_Key");
    res.json({
        message: "You have logged in successfully",
        token,
    });
    return;
}));
router.post('/change', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newfirstName, newlastName, newPassword } = req.body;
        const { firstName, lastName, password } = req.body;
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newhashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        const user = yield users.updateOne({ firstName, lastName, hashedPassword }, {
            firstName: newfirstName,
            lastName: newlastName,
            password: newhashedPassword
        });
        res.json({
            message: "credentials have been changed successfully ",
            user,
        }).status(200);
        return;
    }
    catch (e) {
        res.json({
            error: e,
        }).status(400);
        return;
    }
}));
exports.default = router;
