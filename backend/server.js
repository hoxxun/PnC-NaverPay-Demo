let savedRecurrentId = "";
let savedPaymentId = "";

const express = require("express");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "../front")));



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/index.html"));
});


////////////////////////////////////////////////////////////////////////////


app.get("/register/complete", async (req, res) => {
  const { resultCode, reserveId, tempReceiptId, recurrentId } = req.query;

  console.log("\n========================================");
  console.log("자동결제 등록");
  console.log("========================================");

  console.log("[1] 등록 완료");
  console.log("[2] returnUrl 수신");
  console.log("reserveId     :", reserveId);
  console.log("tempReceiptId :", tempReceiptId);

  if (resultCode === "DataExist") {
    savedRecurrentId = recurrentId;

    console.log("[3] 이미 등록된 recurrentId 확인");
    console.log("recurrentId :", savedRecurrentId);
    console.log("========================================\n");

    return res.send(`
      <h1>이미 자동결제 등록됨</h1>
      <p><b>recurrentId:</b> ${savedRecurrentId}</p>
      <a href="/">메인으로</a>
    `);
  }

  console.log("[3] 백엔드가 등록완료 요청 API 호출 (POST)");

  const response = await axios.post(
    `${process.env.NAVER_API_DOMAIN}/naverpay-partner/naverpay/payments/recurrent/regist/v1/approval`,
    new URLSearchParams({
      reserveId,
      tempReceiptId
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID, 
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET, //PRIVATE
        "X-NaverPay-Chain-Id": process.env.NAVER_CHAIN_ID,
        "X-NaverPay-Idempotency-Key": crypto.randomUUID() //중복방지용
      }
    }
  );

  console.log(response.data);

  savedRecurrentId = response.data.body.recurrentId;

  console.log("[4] recurrentId 발급 완료");
  console.log("recurrentId :", savedRecurrentId);
  console.log("========================================\n");

  res.send(`
    <h1>자동결제 등록 완료</h1>
    <p><b>reserveId:</b> ${reserveId}</p>
    <p><b>tempReceiptId:</b> ${tempReceiptId}</p>
    <p><b>recurrentId:</b> ${savedRecurrentId}</p>
    <a href="/payment/reserve">100,000원 선결제 예약 테스트 (PnC에서는 선결제 금액을 사용하여 예약 API를 호출)</a>
  `);
});


//////////////////////////////////////////////////////////////////////////////


app.get("/payment/reserve", async (req, res) => {
  console.log("\n========================================");
  console.log("자동결제 예약");
  console.log("========================================");
  console.log("[1] recurrentId 조회");
  console.log("recurrentId :", savedRecurrentId);

  console.log("[2] 자동결제 예약 API 호출 (POST)");

  try {
    const response = await axios.post(
      `${process.env.NAVER_API_DOMAIN}/naverpay-partner/naverpay/payments/recurrent/pay/v3/reserve`,
      new URLSearchParams({
        recurrentId: savedRecurrentId,
        totalPayAmount: 100000,
        taxScopeAmount: 100000, //과세 대상 금액
        taxExScopeAmount: 0,    //면세 대상 금액
        productName: "PnC 전기차 충전 선결제",
        merchantPayId: "ORDER_" + Date.now(), //가맹점 주문번호
        merchantUserId: "user_001"  //가맹점 사용자 ID
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
          "X-NaverPay-Chain-Id": process.env.NAVER_CHAIN_ID,
          "X-NaverPay-Idempotency-Key": crypto.randomUUID()
        }
      }
    );

    console.log("[3] 자동결제 예약 API 응답");
    console.log(response.data);

    if (response.data.code !== "Success") {
      console.log("[4] 자동결제 예약 실패");
      console.log("code :", response.data.code);
      console.log("message :", response.data.message);
      console.log("========================================\n");

      return res.send(`
        <h1>자동결제 예약 실패</h1>
      `);
    }

    savedPaymentId = response.data.body.paymentId;

    console.log("[4] paymentId 발급 완료"); //결제 예약 토큰, 결제 승인 API 호출 시 필요
    console.log("paymentId :", savedPaymentId);
    console.log("========================================\n");

    res.send(`
      <h1>자동결제 예약 성공</h1>
      <p><b>paymentId:</b> ${savedPaymentId}</p>
      <a href="/payment/approve">결제 승인</a>
    `);
  } catch (err) {
    const errorData = err.response?.data || err.message;

    console.log("[3] 자동결제 예약 API 에러");
    console.log(errorData);
    console.log("========================================\n");

    res.status(500).send(`
      <h1>자동결제 예약 API 에러</h1>
      <pre>${JSON.stringify(errorData, null, 2)}</pre>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server Running : http://localhost:${PORT}`);
});