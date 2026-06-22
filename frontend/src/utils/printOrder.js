import { formatDateTime } from "./date";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function printOrder(order) {
  const itemsHtml = (order.order_items || [])
    .map(
      (item) => `
        <div class="item">
          <div>
            <strong>${item.quantity}x ${item.product_name}</strong>
            <small>Unidade: ${money(item.unit_price)}</small>
          </div>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `
    )
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Pedido Mesa ${order.table_number}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }

          .receipt {
            width: 80mm;
            padding: 12px;
          }

          .center {
            text-align: center;
          }

          .brand {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .subtitle {
            font-size: 11px;
            margin-top: 2px;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 12px;
            margin: 4px 0;
          }

          .mesa {
            font-size: 28px;
            font-weight: 900;
            text-align: center;
            margin: 10px 0;
          }

          .section-title {
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 6px;
            text-transform: uppercase;
          }

          .item {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 13px;
            margin: 8px 0;
          }

          .item small {
            display: block;
            font-size: 10px;
            margin-top: 2px;
          }

          .obs {
            border: 1px solid #000;
            padding: 8px;
            font-size: 13px;
            font-weight: 700;
            margin-top: 6px;
          }

          .total {
            font-size: 18px;
            font-weight: 900;
          }

          .footer {
            font-size: 10px;
            margin-top: 12px;
          }

          @media print {
            body {
              width: 80mm;
            }

            .receipt {
              width: 80mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="receipt">
          <div class="center">
            <div class="brand">THE SECRET BURGER</div>
            <div class="subtitle">Pedido para cozinha</div>
          </div>

          <div class="line"></div>

          <div class="mesa">MESA ${order.table_number}</div>

          <div class="row">
            <span>Data:</span>
            <strong>${formatDateTime(order.created_at)}</strong>
          </div>

          <div class="row">
            <span>Status:</span>
            <strong>${order.status}</strong>
          </div>

          <div class="line"></div>

          <div class="section-title">Cliente</div>

          <div class="row">
            <span>Nome:</span>
            <strong>${order.customers?.name || "-"}</strong>
          </div>

          <div class="row">
            <span>Telefone:</span>
            <strong>${order.customers?.phone || "-"}</strong>
          </div>

          <div class="line"></div>

          <div class="section-title">Itens</div>

          ${itemsHtml}

          ${
            order.notes
              ? `
                <div class="line"></div>
                <div class="section-title">Observação</div>
                <div class="obs">${order.notes}</div>
              `
              : ""
          }

          <div class="line"></div>

          <div class="row total">
            <span>Total</span>
            <strong>${money(order.total)}</strong>
          </div>

          <div class="line"></div>

          <div class="center footer">
            Conferir pedido antes de entregar
          </div>
        </div>

        <script>
          window.onload = function () {
            window.print();
            setTimeout(function () {
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=420,height=700");

  if (!printWindow) {
    alert("O navegador bloqueou a janela de impressão.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}