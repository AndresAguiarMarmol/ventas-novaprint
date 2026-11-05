/**
 * assets/js/ticket.js — Generación de Comprobantes Imprimibles y Enlaces WhatsApp
 */

(function (global) {
  'use strict';

  /**
   * Resuelve el teléfono del cliente asociado al pedido mediante cascada de fallback
   */
  function obtenerTelefonoCliente(pedido) {
    if (!pedido) return '';
    if (pedido.clientPhone && typeof pedido.clientPhone === 'string' && pedido.clientPhone.trim()) {
      return pedido.clientPhone.trim();
    }
    if (pedido.phone && typeof pedido.phone === 'string' && pedido.phone.trim()) {
      return pedido.phone.trim();
    }
    if (pedido.customerPhone && typeof pedido.customerPhone === 'string' && pedido.customerPhone.trim()) {
      return pedido.customerPhone.trim();
    }

    const storage = global.NovaprintStorage;
    if (storage) {
      if (pedido.clientId && typeof storage.getClientById === 'function') {
        const cliente = storage.getClientById(pedido.clientId);
        if (cliente && cliente.phone && cliente.phone.trim()) {
          return cliente.phone.trim();
        }
      }
      if (pedido.clientName && typeof storage.getClients === 'function') {
        const clientes = storage.getClients() || [];
        const norm = String(pedido.clientName).trim().toLowerCase();
        const coincidencia = clientes.find(c => c.name && c.name.trim().toLowerCase() === norm);
        if (coincidencia && coincidencia.phone && coincidencia.phone.trim()) {
          return coincidencia.phone.trim();
        }
      }
    }
    return '';
  }

  /**
   * Genera el HTML formateado del ticket de venta para cliente u orden de taller
   */
  function generarTicketHTML(pedido, settings = {}) {
    if (!pedido) return '<p class="text-center text-gray-500 py-4">No se ha seleccionado ningún pedido.</p>';

    const sales = global.NovaprintSales;
    const businessName = settings.businessName || 'Novaprint Estampados';
    const rut = settings.rut || '76.890.123-4';
    const phone = settings.phone || '+56987654321';
    const address = settings.address || 'Taller Central Novaprint';
    const footerMsg = settings.ticketFooter || '¡Gracias por confiar en Novaprint!';

    const clienteTelefono = obtenerTelefonoCliente(pedido);
    if (clienteTelefono && !pedido.clientPhone) {
      pedido.clientPhone = clienteTelefono;
    }

    const totalStr = sales ? sales.formatearMoneda(pedido.totals?.totalAmount || 0) : `$${pedido.totals?.totalAmount || 0}`;
    const abonoStr = sales ? sales.formatearMoneda(pedido.totals?.depositAmount || 0) : `$${pedido.totals?.depositAmount || 0}`;
    const saldoStr = sales ? sales.formatearMoneda(pedido.totals?.balanceAmount || 0) : `$${pedido.totals?.balanceAmount || 0}`;

    const fechaCreacion = pedido.dates?.createdAt ? new Date(pedido.dates.createdAt).toLocaleDateString('es-CL') : 'Hoy';
    const fechaEntrega = pedido.dates?.deliveryDate || 'A coordinar';

    const itemsFilas = (pedido.items || []).map((it, idx) => {
      const sub = sales ? sales.formatearMoneda(it.subtotal || (it.quantity * it.unitPrice)) : `$${it.subtotal}`;
      const precioU = sales ? sales.formatearMoneda(it.unitPrice) : `$${it.unitPrice}`;
      return `
        <tr class="border-b border-gray-200">
          <td class="py-2 text-left">
            <span class="font-bold text-gray-800">${it.quantity}x ${it.garmentType}</span>
            <div class="text-xs text-gray-500">Talla: ${it.size} | Color: ${it.color}</div>
            <div class="text-xs font-medium text-indigo-700">Técnica: ${it.technique} (${it.printLocation || 'Pecho'})</div>
            ${it.notes ? `<div class="text-xs italic text-gray-400">${it.notes}</div>` : ''}
          </td>
          <td class="py-2 text-right text-gray-600 align-top">${precioU}</td>
          <td class="py-2 text-right font-bold text-gray-900 align-top">${sub}</td>
        </tr>
      `;
    }).join('');

    return `
      <div id="printable-ticket-content" class="bg-white p-6 max-w-md mx-auto text-sm text-gray-800 font-sans border border-gray-200 rounded-lg shadow-sm">
        <!-- Encabezado de la Empresa -->
        <div class="text-center pb-4 border-b border-dashed border-gray-300">
          <img src="assets/img/logo.png" alt="Novaprint" class="w-14 h-14 mx-auto mb-2 rounded-xl object-contain shadow-2xs">
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">${businessName}</h2>
          <p class="text-xs text-gray-500">RUT: ${rut}</p>
          <p class="text-xs text-gray-500">${address}</p>
          <p class="text-xs text-gray-600 font-medium">WhatsApp: ${phone}</p>
        </div>

        <!-- Datos del Pedido y Cliente -->
        <div class="py-3 border-b border-dashed border-gray-300 space-y-1">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500 uppercase font-semibold">N° Comprobante:</span>
            <span class="font-mono font-bold text-base text-blue-700">${pedido.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">Fecha Emisión:</span>
            <span class="font-medium text-gray-700">${fechaCreacion}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">Compromiso Entrega:</span>
            <span class="font-bold text-gray-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">${fechaEntrega}</span>
          </div>
          <div class="pt-2">
            <div class="text-xs text-gray-500 font-semibold uppercase">Cliente:</div>
            <div class="font-bold text-gray-900 text-base">${pedido.clientName}</div>
            ${clienteTelefono ? `<div class="text-xs text-gray-600 font-medium">Tel: ${clienteTelefono}</div>` : ''}
          </div>
        </div>

        <!-- Tabla de Prendas y Estampados -->
        <div class="py-3">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-gray-300 text-gray-500 uppercase font-semibold">
                <th class="py-1 text-left">Detalle Prenda</th>
                <th class="py-1 text-right">P. Unit</th>
                <th class="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsFilas}
            </tbody>
          </table>
        </div>

        <!-- Resumen Financiero -->
        <div class="py-3 border-t border-dashed border-gray-300 space-y-1.5 text-xs">
          <div class="flex justify-between text-gray-600">
            <span>Total Prendas:</span>
            <span class="font-bold text-gray-800">${pedido.totals?.totalQuantity || 0} un.</span>
          </div>
          ${pedido.totals?.volumeDiscountAmount > 0 ? `
            <div class="flex justify-between text-gray-600">
              <span>Subtotal Bruto:</span>
              <span class="font-medium">${sales.formatearMoneda(pedido.totals.subtotalBruto)}</span>
            </div>
            <div class="flex justify-between text-emerald-700 font-semibold">
              <span>Descuento Volumen (${pedido.totals.volumeDiscountPercent}%):</span>
              <span>-${sales.formatearMoneda(pedido.totals.volumeDiscountAmount)}</span>
            </div>
          ` : ''}
          ${(pedido.totals?.volumeDiscountAmount > 0 || pedido.totals?.applyIva || (pedido.totals?.deliveryAmount > 0)) ? `
            <div class="flex justify-between text-gray-700 font-semibold">
              <span>Monto Neto:</span>
              <span>${sales.formatearMoneda(pedido.totals?.netAmount ?? (pedido.totals?.subtotalBruto || 0))}</span>
            </div>
          ` : ''}
          ${pedido.totals?.ivaAmount > 0 ? `
            <div class="flex justify-between text-slate-800">
              <span>IVA (19%):</span>
              <span>+${sales.formatearMoneda(pedido.totals.ivaAmount)}</span>
            </div>
          ` : ''}
          ${pedido.totals?.deliveryAmount > 0 ? `
            <div class="flex justify-between text-slate-800">
              <span>Delivery / Envío:</span>
              <span>+${sales.formatearMoneda(pedido.totals.deliveryAmount)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between text-base font-bold text-gray-900 border-t pt-1">
            <span>TOTAL A PAGAR:</span>
            <span class="text-blue-700 font-black">${totalStr}</span>
          </div>
          <div class="flex justify-between text-gray-700">
            <span>Monto Abonado:</span>
            <span class="font-semibold text-emerald-700">${abonoStr}</span>
          </div>
          <div class="flex justify-between text-base font-bold ${pedido.totals?.balanceAmount > 0 ? 'text-red-600 bg-red-50 p-1.5 rounded' : 'text-gray-900'}">
            <span>SALDO PENDIENTE:</span>
            <span class="font-black">${saldoStr}</span>
          </div>
          <div class="flex justify-between text-xs text-gray-500 pt-1">
            <span>Estado de Pago:</span>
            <span class="font-bold ${pedido.totals?.paymentStatus === 'Pagado Total' ? 'text-emerald-700' : 'text-amber-700'}">${pedido.totals?.paymentStatus || 'Pendiente'}</span>
          </div>
        </div>

        ${pedido.notes ? `
          <div class="my-3 p-2 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600">
            <span class="font-bold text-gray-700">Observaciones:</span> ${pedido.notes}
          </div>
        ` : ''}

        <!-- Pie de página -->
        <div class="text-center pt-4 border-t border-dashed border-gray-300 text-xs text-gray-500">
          <p class="font-medium text-gray-700 mb-1">${footerMsg}</p>
          <p class="text-[11px] text-gray-400">Novaprint App — Sistema de Gestión y Taller</p>
        </div>
      </div>
    `;
  }

  /**
   * Dispara el diálogo nativo de impresión configurando la clase en body
   */
  function imprimirTicket() {
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('printing-ticket');
    }
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
    setTimeout(() => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('printing-ticket');
      }
    }, 500);
  }

  // Listener para sincronizar Ctrl+P con el diálogo de ticket si está abierto
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('beforeprint', () => {
      const dialog = document.getElementById('dialog-ticket');
      if (dialog && dialog.open && document.body) {
        document.body.classList.add('printing-ticket');
      }
    });

    window.addEventListener('afterprint', () => {
      if (document.body) {
        document.body.classList.remove('printing-ticket');
      }
    });
  }

  /**
   * Abre directamente WhatsApp con el mensaje estructurado del pedido
   */
  function abrirWhatsAppPedido(pedido, settings = {}) {
    if (!pedido) {
      if (typeof alert === 'function') alert('No se ha seleccionado ningún pedido.');
      return null;
    }

    let telefono = obtenerTelefonoCliente(pedido);

    if (!telefono) {
      const nombreCliente = pedido.clientName || 'Cliente';
      let promptRes = null;
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        promptRes = window.prompt(`El cliente "${nombreCliente}" no tiene un teléfono registrado. Ingresa su número de WhatsApp (ej: +56912345678):`);
      }

      if (promptRes && promptRes.trim()) {
        telefono = promptRes.trim();
        pedido.clientPhone = telefono;
        const storage = global.NovaprintStorage;
        if (storage && typeof storage.saveOrder === 'function') {
          storage.saveOrder(pedido);
          if (pedido.clientId && typeof storage.getClientById === 'function') {
            const cliente = storage.getClientById(pedido.clientId);
            if (cliente && !cliente.phone) {
              storage.saveClient({ ...cliente, phone: telefono });
            }
          }
        }
      } else {
        if (typeof alert === 'function') {
          alert('El pedido no tiene un número de teléfono/WhatsApp asociado.');
        }
        return null;
      }
    } else if (!pedido.clientPhone && global.NovaprintStorage && typeof global.NovaprintStorage.saveOrder === 'function') {
      // Sincronizar en el pedido para que quede persistido
      pedido.clientPhone = telefono;
      global.NovaprintStorage.saveOrder(pedido);
    }

    const sales = global.NovaprintSales;
    const mensaje = sales ? sales.generarTextoWhatsApp(pedido, settings) : `Hola! Te enviamos el comprobante del pedido ${pedido.id}`;
    
    // Limpiar número dejando solo dígitos
    let phoneClean = telefono.replace(/[^0-9]/g, '');
    if (phoneClean.startsWith('9') && phoneClean.length === 9) {
      phoneClean = '56' + phoneClean; // Prefijo de Chile por defecto si tiene 9 dígitos
    }

    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(mensaje)}`;
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank');
    }
    return url;
  }

  const ticketModule = {
    obtenerTelefonoCliente,
    generarTicketHTML,
    imprimirTicket,
    abrirWhatsAppPedido
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ticketModule;
  }
  global.NovaprintTicket = ticketModule;

})(typeof window !== 'undefined' ? window : globalThis);

