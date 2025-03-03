import { useState, useEffect } from "react"

export default function UVACalculator() {
  const [loanAmount, setLoanAmount] = useState<number | null>(100_000_000)
  const [loanTerm, setLoanTerm] = useState<number | null>(120)
  const [interestRate, setInterestRate] = useState<number | null>(5)
  const [extraPayment, setExtraPayment] = useState<number | null>(0)
  const [earlyPaymentPenalty, setEarlyPaymentPenalty] = useState<number | null>(
    2,
  )
  const [amortization, setAmortization] = useState<Amortization[]>([])
  const [amortizationWithExtra, setAmortizationWithExtra] = useState<
    AmortizationWithExtra[]
  >([])
  const [totalInterest, setTotalInterest] = useState(0)
  const [totalInterestWithExtra, setTotalInterestWithExtra] = useState(0)
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [showInstallments, setShowInstallments] = useState(false)
  const [currentInstallment, setCurrentInstallment] = useState(1)
  const [monthsSaved, setMonthsSaved] = useState(0)
  const [compareView, setCompareView] = useState(true)
  const [penaltyAmount, setPenaltyAmount] = useState(0)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [errors, setErrors] = useState({
    loanAmount: false,
    loanTerm: false,
    interestRate: false,
  })

  // Check for required fields and set validation errors
  const validateInputs = () => {
    const newErrors = {
      loanAmount: !loanAmount,
      loanTerm: !loanTerm,
      interestRate: !interestRate && interestRate !== 0,
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error)
  }

  // Check if there are any validation errors
  const hasErrors = () => {
    return Object.values(errors).some((error) => error)
  }

  // Calculate the amortization schedule
  const calculateAmortization = () => {
    if (!validateInputs()) {
      return []
    }

    const values = getCleanValues()
    const monthlyRate = values.interestRate / 100 / 12

    // Skip calculation if we don't have valid data for the formula
    if (
      values.loanAmount <= 0 ||
      values.loanTerm <= 0 ||
      values.interestRate <= 0
    ) {
      return []
    }

    const payment =
      values.loanAmount *
      ((monthlyRate * Math.pow(1 + monthlyRate, values.loanTerm)) /
        (Math.pow(1 + monthlyRate, values.loanTerm) - 1))

    // Regular amortization schedule (without extra payments)
    let balance = values.loanAmount
    const amortizationSchedule = []
    let totalInterestAccumulated = 0

    for (let month = 1; month <= values.loanTerm; month++) {
      const interestPayment = balance * monthlyRate
      const principalPayment = payment - interestPayment

      totalInterestAccumulated += interestPayment
      balance -= principalPayment

      amortizationSchedule.push({
        month,
        payment,
        principalPayment,
        interestPayment,
        balance: balance > 0 ? balance : 0,
        totalInterest: totalInterestAccumulated,
      })
    }

    // Amortization schedule with extra payments
    balance = values.loanAmount
    const amortizationWithExtraSchedule = []
    let totalInterestWithExtraAccumulated = 0
    let month = 1

    while (balance > 0 && month <= values.loanTerm) {
      const interestPayment = balance * monthlyRate
      const principalPayment = payment - interestPayment
      const extraPayment =
        (1 - values.earlyPaymentPenalty / 100) * values.extraPayment
      const actualPrincipalPayment = principalPayment + extraPayment

      totalInterestWithExtraAccumulated += interestPayment
      balance -= actualPrincipalPayment

      if (balance < 0) balance = 0

      amortizationWithExtraSchedule.push({
        month,
        payment: payment + extraPayment,
        regularPayment: payment,
        extraPayment: extraPayment,
        principalPayment: actualPrincipalPayment,
        interestPayment,
        balance,
        totalInterest: totalInterestWithExtraAccumulated,
      })

      if (balance === 0) break
      month++
    }

    const monthsSaved = values.loanTerm - amortizationWithExtraSchedule.length

    // Calculate early payment penalty
    const penalty =
      amortizationWithExtraSchedule.length *
      values.extraPayment *
      (values.earlyPaymentPenalty / 100)

    setMonthlyPayment(payment)
    setTotalInterest(totalInterestAccumulated)
    setTotalInterestWithExtra(totalInterestWithExtraAccumulated)
    setAmortization(amortizationSchedule)
    setAmortizationWithExtra(amortizationWithExtraSchedule)
    setMonthsSaved(monthsSaved)
    setPenaltyAmount(penalty)
  }

  // Use cleaned up values for calculations
  const getCleanValues = () => {
    return {
      loanAmount: loanAmount === null ? 0 : Number(loanAmount),
      loanTerm: loanTerm === null ? 0 : Number(loanTerm),
      interestRate: interestRate === null ? 0 : Number(interestRate),
      extraPayment: extraPayment === null ? 0 : Number(extraPayment),
      earlyPaymentPenalty:
        earlyPaymentPenalty === null ? 0 : Number(earlyPaymentPenalty),
    }
  }

  // Calculate on input change
  useEffect(() => {
    calculateAmortization()
  }, [loanAmount, loanTerm, interestRate, extraPayment, earlyPaymentPenalty])

  // Handle showing more installments
  const handleShowMore = (increment: number) => {
    if (!loanTerm) return

    setCurrentInstallment((prev) => {
      const newValue = prev + increment
      if (newValue < 1) return 1
      if (newValue > loanTerm - 9) return loanTerm - 9
      return newValue
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-800">
        Calculadora de Créditos Hipotecarios UVA
      </h1>
      <p className="text-center mb-6 text-gray-600">
        Calcula las cuotas mensuales para tu crédito hipotecario ajustado por
        UVA.
      </p>

      {/* Main loan information section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">
          Información Básica del Préstamo
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Monto del Préstamo ($)
            </label>
            <div className="relative">
              <input
                type="text"
                value={loanAmount === null ? "" : formatNumber(loanAmount)}
                onChange={(e) => {
                  // Remove all non-numeric characters and convert to number
                  const numericValue = cleanNumericValue(e.target.value)
                  if (numericValue) {
                    setLoanAmount(Number(numericValue))
                    setErrors({ ...errors, loanAmount: false })
                  } else {
                    setLoanAmount(null)
                  }
                }}
                id="loan-amount"
                className={`w-full p-2 border ${errors.loanAmount ? "border-red-500" : "border-gray-300"} rounded`}
                inputMode="numeric"
              />
              {errors.loanAmount && (
                <p className="text-red-500 text-xs mt-1">
                  Este campo es obligatorio
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Plazo (meses)
            </label>
            <div className="relative">
              <input
                type="text"
                value={loanTerm === null ? "" : formatNumber(loanTerm)}
                onChange={(e) => {
                  // Remove all non-numeric characters and convert to number
                  const numericValue = cleanNumericValue(e.target.value)
                  if (numericValue) {
                    setLoanTerm(Number(numericValue))
                    setErrors({ ...errors, loanTerm: false })
                  } else {
                    setLoanTerm(null)
                  }
                }}
                id="loan-term"
                className={`w-full p-2 border ${errors.loanTerm ? "border-red-500" : "border-gray-300"} rounded`}
                inputMode="numeric"
              />
              {errors.loanTerm && (
                <p className="text-red-500 text-xs mt-1">
                  Este campo es obligatorio
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tasa de Interés Anual (%)
            </label>
            <div className="relative">
              <input
                type="text"
                value={interestRate === null ? "" : interestRate}
                onChange={(e) => {
                  const value = cleanNumericValueWithDecimals(e.target.value)
                  if (value === "") {
                    setInterestRate(null)
                  } else {
                    setInterestRate(Number(value))
                    setErrors({ ...errors, interestRate: false })
                  }
                }}
                id="interest-rate"
                className={`w-full p-2 border ${errors.interestRate ? "border-red-500" : "border-gray-300"} rounded`}
                inputMode="decimal"
              />
              {errors.interestRate && (
                <p className="text-red-500 text-xs mt-1">
                  Este campo es obligatorio
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced payment options section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">
          Opciones de Cancelación Anticipada
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pago Extra Mensual ($)
            </label>
            <div className="relative">
              <input
                type="text"
                value={extraPayment === null ? "" : formatNumber(extraPayment)}
                onChange={(e) => {
                  // Remove all non-numeric characters and convert to number
                  const numericValue = cleanNumericValue(e.target.value)
                  if (numericValue) {
                    setExtraPayment(Number(numericValue))
                  } else {
                    setExtraPayment(null)
                  }
                }}
                id="extra-payment"
                className="w-full p-2 border border-gray-300 rounded"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto adicional que planeas pagar cada mes para reducir el
                capital
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Penalidad por Precancelación (%)
            </label>
            <div className="relative">
              <input
                type="text"
                value={earlyPaymentPenalty === null ? "" : earlyPaymentPenalty}
                onChange={(e) => {
                  const value = cleanNumericValueWithDecimals(e.target.value)
                  if (value === "") {
                    setEarlyPaymentPenalty(null)
                  } else {
                    setEarlyPaymentPenalty(Number(value))
                  }
                }}
                id="penalty-rate"
                className="w-full p-2 border border-gray-300 rounded"
                inputMode="decimal"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje que cobra el banco por realizar pagos anticipados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results section */}
      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        {!extraPayment ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Cuota Mensual</p>
              <p className="text-xl font-bold text-blue-800">
                {formatCurrency(monthlyPayment)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Interés Total</p>
              <p className="text-xl font-bold text-blue-800">
                {formatCurrency(totalInterest)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Monto Total a Pagar</p>
              <p className="text-xl font-bold text-blue-800">
                {formatCurrency((loanAmount ?? 0) + totalInterest)}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium text-center">Plan Original</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Cuota Mensual</p>
                    <p className="font-bold text-blue-800">
                      {formatCurrency(monthlyPayment)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Plazo</p>
                    <p className="font-bold text-blue-800">{loanTerm} meses</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Interés Total</p>
                    <p className="font-bold text-blue-800">
                      {formatCurrency(totalInterest)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Monto Total</p>
                    <p className="font-bold text-blue-800">
                      {formatCurrency((loanAmount ?? 0) + totalInterest)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-center">
                  Con Pago Extra de {formatCurrency(extraPayment ?? 0, 0)}/mes
                </h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Cuota Total</p>
                    <p className="font-bold text-green-700">
                      {formatCurrency(monthlyPayment + (extraPayment ?? 0))}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Nuevo Plazo</p>
                    <p className="font-bold text-green-700">
                      {(loanTerm ?? 0) - monthsSaved} meses
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Nuevo Interés Total</p>
                    <p className="font-bold text-green-700">
                      {formatCurrency(totalInterestWithExtra)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Nuevo Monto Total</p>
                    <p className="font-bold text-green-700">
                      {formatCurrency(
                        (loanAmount ?? 0) + totalInterestWithExtra,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-100 p-3 rounded">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-700">Tiempo Ahorrado</p>
                  <p className="text-xl font-bold text-green-800">
                    {monthsSaved} meses
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-700">Interés Ahorrado</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(totalInterest - totalInterestWithExtra)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-700">
                    Penalidad por Precancelación
                  </p>
                  <p className="text-xl font-bold text-red-800">
                    {formatCurrency(penaltyAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-white rounded">
                <p className="text-center text-sm font-medium">
                  {penaltyAmount > 0 ? (
                    <>
                      Ahorro Neto:{" "}
                      <span
                        className={
                          totalInterest -
                            totalInterestWithExtra -
                            penaltyAmount >
                          0
                            ? "text-green-700 font-bold"
                            : "text-red-700 font-bold"
                        }
                      >
                        {formatCurrency(
                          totalInterest -
                            totalInterestWithExtra -
                            penaltyAmount,
                        )}
                      </span>
                    </>
                  ) : (
                    "Sin penalidad por cancelación anticipada"
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Amortization table section */}
      <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-xl font-semibold">Tabla de Amortización</h2>
        <button
          onClick={() => setShowInstallments(!showInstallments)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {showInstallments ? "Ocultar Cuotas" : "Mostrar Cuotas"}
        </button>
      </div>

      {showInstallments && (
        <div className="overflow-x-auto">
          <div className="mb-2 flex justify-between">
            <button
              onClick={() => handleShowMore(-10)}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
              disabled={currentInstallment <= 1}
            >
              &laquo; Anterior
            </button>
            <span className="text-sm text-gray-500">
              Mostrando cuotas {currentInstallment} -{" "}
              {Math.min(
                currentInstallment + 9,
                extraPayment && compareView
                  ? amortizationWithExtra.length
                  : (loanTerm ?? 0),
              )}{" "}
              de{" "}
              {extraPayment && compareView
                ? amortizationWithExtra.length
                : loanTerm}
            </span>
            <button
              onClick={() => handleShowMore(10)}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
              disabled={
                currentInstallment >=
                (extraPayment && compareView
                  ? amortizationWithExtra.length
                  : (loanTerm ?? 0)) -
                  9
              }
            >
              Siguiente &raquo;
            </button>
          </div>

          {!compareView || !extraPayment ? (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Cuota</th>
                  <th className="border p-2 text-right">Cuota Mensual</th>
                  <th className="border p-2 text-right">Capital</th>
                  <th className="border p-2 text-right">Interés</th>
                  <th className="border p-2 text-right">Saldo Restante</th>
                </tr>
              </thead>
              <tbody>
                {amortization
                  .slice(currentInstallment - 1, currentInstallment + 9)
                  .map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="border p-2">{row.month}</td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.payment)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.principalPayment)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.interestPayment)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Cuota</th>
                  <th className="border p-2 text-right">Cuota Básica</th>
                  <th className="border p-2 text-right">Pago Extra</th>
                  <th className="border p-2 text-right">Capital</th>
                  <th className="border p-2 text-right">Interés</th>
                  <th className="border p-2 text-right">Saldo Restante</th>
                </tr>
              </thead>
              <tbody>
                {amortizationWithExtra
                  .slice(currentInstallment - 1, currentInstallment + 9)
                  .map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="border p-2">{row.month}</td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.regularPayment)}
                      </td>
                      <td className="border p-2 text-right text-green-700">
                        {formatCurrency(row.extraPayment)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.principalPayment)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.interestPayment)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg text-sm">
        <p className="font-medium mb-2">Nota Importante:</p>
        <p>
          Esta calculadora proporciona una estimación basada en el sistema de
          amortización francés. Los créditos UVA en Argentina están sujetos a
          ajustes por inflación que no están contemplados en este cálculo
          básico.
        </p>
        <p className="mt-2">
          El cálculo con pagos extras muestra cómo los pagos adicionales
          mensuales reducen el capital directamente y acortan el plazo total del
          préstamo, siguiendo el sistema francés de amortización.
        </p>
        <p className="mt-2">
          La penalidad por cancelación anticipada se calcula como un porcentaje
          del saldo restante del préstamo al momento de la cancelación, y se
          debe pagar al banco como compensación por la finalización anticipada
          del contrato.
        </p>
        <p className="mt-2">
          Consulte con una entidad financiera para obtener información más
          precisa sobre su caso particular y confirmar la política de pagos
          anticipados y penalidades.
        </p>
      </div>
    </div>
  )
}

interface Amortization {
  month: number
  payment: number
  principalPayment: number
  interestPayment: number
  balance: number
  totalInterest: number
}

interface AmortizationWithExtra extends Amortization {
  regularPayment: number
  extraPayment: number
}

const formatCurrency = (value: number, decimals = 2) => {
  return new Intl.NumberFormat(navigator.language || "es-AR", {
    style: "currency",
    currency: "ARS",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: decimals,
  }).format(value)
}

// Format numbers with thousand separators based on user's locale
const formatNumber = (value: number) => {
  if (value === null || value === undefined) return ""
  return new Intl.NumberFormat(navigator.language || "es-AR").format(value)
}

const cleanNumericValue = (value: string) => {
  return value.replace(/[^0-9]/g, "")
}

const cleanNumericValueWithDecimals = (value: string) => {
  // Get the decimal separator for the current locale
  const decimalSeparator = (1.1)
    .toLocaleString(navigator.language || "es-AR")
    .charAt(1)

  // Create a regex that matches everything except digits and the decimal separator
  const regex = new RegExp(`[^\\d${decimalSeparator}]`, "g")

  // Remove all non-numeric characters except the decimal separator
  let cleaned = value.replace(regex, "")

  // Replace the locale-specific decimal separator with a period
  cleaned = cleaned.replace(decimalSeparator, ".")

  // Ensure only one decimal point
  const parts = cleaned.split(".")
  cleaned =
    parts.length > 1 ? parts[0] + "." + parts.slice(1).join("") : parts[0]

  return cleaned
}
