/**
 * Generate a simplified ISO20022 payment message for SWIFT transmission
 */
export function formatSwiftMessage(payment, customer, employee) {
  return `
<ISO20022>
  <Document>
    <CstmrCdtTrfInitn>
      <GrpHdr>
        <MsgId>${payment._id}</MsgId>
        <CreDtTm>${new Date().toISOString()}</CreDtTm>
        <NbOfTxs>1</NbOfTxs>
        <InitgPty>
          <Nm>${customer.name} ${customer.surname}</Nm>
        </InitgPty>
      </GrpHdr>
      <PmtInf>
        <PmtInfId>${payment._id}</PmtInfId>
        <PmtMtd>TRF</PmtMtd>
        <ReqdExctnDt>${new Date().toISOString().split("T")[0]}</ReqdExctnDt>
        <Dbtr>
          <Nm>${customer.name} ${customer.surname}</Nm>
        </Dbtr>
        <Cdtr>
          <Nm>SWIFT-Beneficiary</Nm>
          <Acct>${payment.toAccount}</Acct>
        </Cdtr>
        <Amt Ccy="${payment.currency}">${payment.amount}</Amt>
        <ChrgBr>SHAR</ChrgBr>
      </PmtInf>
      <SplmtryData>
        <RmtInf>Processed by ${employee.username}</RmtInf>
      </SplmtryData>
    </CstmrCdtTrfInitn>
  </Document>
</ISO20022>
  `.trim();
}
// (SwiftOnServer, 2024).