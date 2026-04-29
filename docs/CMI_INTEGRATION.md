# CMI Integration Guide

## Status

**Mock mode active** — the app currently simulates CMI payments locally so
the flow can be tested end-to-end without real credentials. No real money
moves while `EXPO_PUBLIC_CMI_MERCHANT_ID` and `EXPO_PUBLIC_CMI_STORE_KEY`
are unset.

## Switching to real CMI payments

### 1. Prerequisites

- [ ] Moroccan business entity (SARL / SA / Auto-Entrepreneur)
- [ ] Business bank account at a CMI-affiliated bank (Attijariwafa, BMCE,
      BCP, …)
- [ ] Signed CMI convention with your bank
- [ ] CMI credentials received: `MERCHANT_ID` and `STORE_KEY`
- [ ] Production return URL hosted on a public HTTPS domain you control

### 2. Configuration

Fill in your `.env` (or EAS secrets) with the values from CMI:

```
EXPO_PUBLIC_CMI_MERCHANT_ID=<your-merchant-id>
EXPO_PUBLIC_CMI_STORE_KEY=<your-store-key>
EXPO_PUBLIC_CMI_API_URL=https://payment.cmi.co.ma/fim/est3Dgate
EXPO_PUBLIC_CMI_RETURN_URL=https://yourdomain.com/payment/cmi-callback
EXPO_PUBLIC_CMI_FAILURE_URL=https://yourdomain.com/payment/cmi-failure
```

As soon as `MERCHANT_ID` and `STORE_KEY` are present, `paymentService.ts`
flips to real mode (`isMockMode === false`) and `mockSimulatePaymentResult`
is no longer reached.

### 3. Implement `realInitiatePayment` in `lib/services/paymentService.ts`

CMI's `est3Dgate` endpoint expects a form POST or a redirect with a
specific parameter set, signed with SHA-512.

Required params (non-exhaustive):

| Param         | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| `clientid`    | `EXPO_PUBLIC_CMI_MERCHANT_ID`                               |
| `oid`         | Order id (use `payload.orderId` so we can reconcile later)  |
| `amount`      | `payload.amount` (2 decimals, dot separator)                |
| `currency`    | ISO 4217 numeric code (`504` for MAD)                       |
| `okUrl`       | `EXPO_PUBLIC_CMI_RETURN_URL`                                |
| `failUrl`     | `EXPO_PUBLIC_CMI_FAILURE_URL`                               |
| `lang`        | `fr` / `ar` / `en`                                          |
| `email`       | `payload.customerEmail`                                     |
| `tel`         | `payload.customerPhone`                                     |
| `rnd`         | Random nonce (timestamp or UUID)                            |
| `storetype`   | `3D_PAY_HOSTING`                                            |
| `TranType`    | `PreAuth` or `Auth`                                         |
| `hashAlgorithm` | `ver3`                                                    |
| `hash`        | SHA-512 of the canonical param string + `STORE_KEY`         |

The hash MUST be computed server-side or inside an Edge Function so the
`STORE_KEY` is never bundled in the mobile app — shipping the store key
to the client would let anyone forge transactions.

Recommended split:

1. Create a Supabase Edge Function `cmi-initiate` that:
   - receives `{ orderId }` from the app,
   - reads the order from the DB (authoritative amount / currency),
   - computes the hash with the server-side `STORE_KEY`,
   - returns the signed `paymentUrl`.
2. `realInitiatePayment` calls that function via
   `supabase.functions.invoke('cmi-initiate', { body: { orderId } })`.

### 4. Render the WebView

Replace the mock branch in `app/payment/[orderId].tsx` with a
`react-native-webview` (`WebView`) instance pointed at `paymentUrl`.

Use `onShouldStartLoadWithRequest` (iOS) / `onNavigationStateChange`
(Android) to detect when CMI navigates back to `okUrl` or `failUrl`:

```tsx
<WebView
  source={{ uri: paymentUrl }}
  onShouldStartLoadWithRequest={(req) => {
    if (req.url.startsWith(process.env.EXPO_PUBLIC_CMI_RETURN_URL!)) {
      handleCmiReturn(req.url);
      return false;
    }
    if (req.url.startsWith(process.env.EXPO_PUBLIC_CMI_FAILURE_URL!)) {
      handleCmiFailure(req.url);
      return false;
    }
    return true;
  }}
/>
```

### 5. Verify the callback signature server-side

The redirect URL carries CMI's response (transaction id, response code,
mdStatus, hash, …). Do **not** trust those parameters directly — also
hit a Supabase Edge Function `cmi-verify` that:

- recomputes the hash with `STORE_KEY`,
- compares it to the `HASH` query param,
- if it matches and `Response === 'Approved'`, calls `markOrderAsPaid`
  with `payment_reference = oid` (or `TransId`),
- otherwise calls `markOrderAsFailed`.

Trigger P9.2 on the `orders` table will then decrement `stock_qty`
automatically when `status` flips to `paid`.

### 6. Test cards

CMI provides sandbox card numbers (Visa / Mastercard) that exercise the
3DS flow. Run through them in this order before going live:

1. Approved transaction
2. Declined transaction
3. 3DS authentication failure
4. Timeout / abandoned payment
5. User cancels mid-3DS

For each, confirm the order status in `orders` and the `stock_qty`
delta on the related products.

### 7. Going live

- [ ] Switch `EXPO_PUBLIC_CMI_API_URL` to the production endpoint CMI
      gives you (the sandbox URL is different).
- [ ] Move `STORE_KEY` out of `.env` and into EAS secrets / Supabase
      function env so it never ships in the client bundle.
- [ ] Enable webhook retries on the verify function (CMI may call it
      twice).
- [ ] Add a `payments_log` table to keep an audit trail of every
      attempt (success and failure) — useful for chargebacks.

## File map

| File                                  | Role                                       |
| ------------------------------------- | ------------------------------------------ |
| `lib/services/paymentService.ts`      | `initiateCmiPayment`, mock/real switch     |
| `app/payment/[orderId].tsx`           | Loading screen + (later) WebView host      |
| `app/payment/success.tsx`             | Post-payment success, clears cart          |
| `app/payment/failure.tsx`             | Post-payment failure with retry            |
| `.env.example`                        | Variables to populate in `.env`            |
