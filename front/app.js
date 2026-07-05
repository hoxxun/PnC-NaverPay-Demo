const oPay = Naver.Pay.create({
    payType: "recurrent", //normal
    mode: "development",  //production
    clientId: "HN3GGCMDdTgGUfl0kFCo",
    chainId: "cjRmZm16VWdRbGp"
});

const btn = document.getElementById("naverPayBtn");

btn.addEventListener("click", () => {

    const vehicleId = document.getElementById("vehicleId").value;

    const userId = document.getElementById("userId").value;

    oPay.open({

        productCode: vehicleId, //중복 등록 방지용
        productName: "전기차 충전 자동결제",
        totalPayAmount: 0,
        merchantUserId: userId,
        returnUrl: "http://localhost:3000/register/complete"
    });

});