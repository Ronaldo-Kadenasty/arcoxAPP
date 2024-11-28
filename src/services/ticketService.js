function rightAlignText(text, lineWidth) {
    const padding = Math.max(lineWidth - text.length, 0);
    return ' '.repeat(padding) + text;
}
function sanitizeText(text) {
    // Remover o reemplazar caracteres especiales, como el símbolo '#'
    return text.replace(/[^a-zA-Z0-9\s.,\-\/\\]/g, ''); // Solo permite letras, números, espacios, puntos, comas y guiones
}
function breakTextByWord(text, maxLength) {
    const words = text.split(' ');
    let currentLine = '';
    let result = '';

    for (let i = 0; i < words.length; i++) {
        if ((currentLine + words[i]).length > maxLength) {
            // Si añadir la siguiente palabra excede el límite, añadir la línea actual al resultado
            result += currentLine.trim() + '\n';
            currentLine = words[i] + ' ';
        } else {
            // Si cabe, añadir la palabra a la línea actual
            currentLine += words[i] + ' ';
        }
    }
    
    // Añadir la última línea que quedó pendiente
    result += currentLine.trim();
    return result;
}
const TicketService = {
    generateTicket(type, data) {
        switch (type) {
            case 'resurtido':
                return this.generateResurtidoTicket(data);
            case 'corte_caja':
                return this.generateCorteCajaTicket(data);
            case 'venta':
                return this.generateVentaTicket(data);
            default:
                console.error('Tipo de ticket no válido');
                return;
        }
    },


    generateResurtidoTicket(data) {
        let header = 'rawbt:';
        ;
        let text = "D. ARCOX   -  RESURTIDO\n";
        let date = `Fecha:  ${new Date().toLocaleString()}`;
        text += `${date}\n`
        text += "======================================\n"; // Separador
        text += "Producto                       Cantidad\n";
        text += "---------------------------------------\n"; // Línea bajo headers


       // let remainingText = name.slice(maxNameLength - 5);


        const maxNameLength = 55;
        
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const name = item.name;
            let quantity = item.quantity.toString();

            if (name.length > maxNameLength - 2) {
                let firstLine = name.slice(0, maxNameLength - 5).padEnd(maxNameLength - 10, ' ') + quantity;
                let remainingText = name.slice(maxNameLength - 5);

                while (remainingText.length > 0) {
                    let nextLine = remainingText.slice(0, maxNameLength);
                    remainingText = remainingText.slice(maxNameLength);
                    firstLine += `\n${nextLine}`;
                }

                text += `${firstLine}\n`;
            } else {
                const paddedName = name.padEnd(maxNameLength - 15, ' ');
                text += `${paddedName}${quantity}\n`;
            }
        }

        text += "==================================\n"; // Separador


        let encodedText = encodeURIComponent(text);
        let final = header + encodedText;

        return final;
    },
    generateCorteCajaTicket(seller, data,subtotal, expenses, total) {
        let header = 'rawbt:';
        let lineWidth = 40; // Ajusta este valor según el ancho de tu ticket (número de caracteres por línea)
        let text = "             DISTRIBUIDORA ARCOX \n"
        text += "                Corte de Caja\n";
        text += "=".repeat(lineWidth) + "\n"; // Separador
        text+=`Vendedor: ${seller}\n`;
        let date = `Fecha:  ${new Date().toLocaleString()}`;
        text += `${date}\n`
       
       
        text += "=".repeat(lineWidth) + "\n"; // Separador
    
        // Encabezado de la sección de ventas
        text += "Venta".padEnd(10, ' ') + "Total".padStart(lineWidth - 10, ' ') + "\n";
        text += "-".repeat(lineWidth) + "\n"; // Línea bajo los headers
    
        // Iterar sobre las ventas y mostrar cada una
        for (let i = 0; i < data.length; i++) {
            const sale = data[i];
            const saleId = `Venta ${sale.id}`.padEnd(10, ' ');  // Alinear el texto de la venta a la izquierda
            const total = `${parseFloat(JSON.parse(sale.data).total).toFixed(2)}`.padStart(lineWidth - 10, ' ');  // Alinear el total a la derecha
            text += `${saleId}${total}\n`;
        }
    
        text += "=".repeat(lineWidth) + "\n"; // Separador
    
        // Puedes añadir aquí la lógica específica del total de ventas, efectivo inicial, etc.
         text += `Total Ventas: ${subtotal.toFixed(2)}\n`;
        text += `Total Gastos: ${expenses.toFixed(2)}\n`;
        text += "-".repeat(lineWidth) + "\n"; // Separador
        text += `Efectivo Final: ${total.toFixed(2)}\n`;
        // text += `Diferencia: $${data.difference.toFixed(2)}\n`;
    
        text += "=".repeat(lineWidth) + "\n"; // Separador
        text += "¡Gracias por su trabajo!\n";
    
        // Codificar el texto para que sea seguro usarlo en la URL
        let encodedText = encodeURIComponent(text);
        let final = header + encodedText;
    
        return final;
    },
    
   
    // generateVentaTicket(seller, route, data, totalF, cashReceived, change) {
    //     let header = 'rawbt:';

    //     // Header del ticket con el vendedor y la ruta
    //     let text = "             DISTRIBUIDORA ARCOX \n"
    //     text += 'Gerente: Manuel Morales Arcos\n'
    //     text += 'RFC. MOAM870216217\n'
    //     text += 'Numero de contacto : 231-150-8427\n'
    //     text += "==========================================\n"; // Separador
    //     text += `Fecha:  ${new Date().toLocaleString()}\n`
    //     text += `Vendedor: ${seller}\nRuta: ${route}\n`;
    //     text += "==========================================\n"; // Separador
    //     //text += "Venta\n";
    //     //text += "==========================================\n"; // Separador

    //     // Encabezados de las columnas
    //     text += "Cant.  Producto      P.Unitario  Subtotal\n";
    //     text += "-----------------------------------------\n"; // Línea bajo headers

    //     const maxNameLength = 19; // Ajustar para que se acomode a la estructura deseada

    //     for (let i = 0; i < data.length; i++) {
    //         const item = data[i];
    //         const name = item.name;
    //         let quantity = item.quantity.toString();
    //         let price = (item.price - (item.discount ? item.discount : 0)).toFixed(2);
    //         let total = (price * item.quantity).toFixed(2);

    //         if (name.length > maxNameLength) {
    //             // Si el nombre del producto es muy largo, se divide en varias líneas
    //             let firstLine = `${quantity.padEnd(3, ' ')}${name.slice(0, maxNameLength).padEnd(maxNameLength, ' ')}`;
    //             firstLine += `${price.padStart(8, ' ')}  ${total.padStart(8, ' ')}`;
    //             let remainingText = name.slice(maxNameLength);

    //             // Manejo del texto que sobra
    //             while (remainingText.length > 0) {
    //                 let nextLine = remainingText.slice(0, maxNameLength);
    //                 remainingText = remainingText.slice(maxNameLength);
    //                 firstLine += `\n${" ".repeat(3)}${nextLine}`; // Añadir espacios al inicio de la línea
    //             }

    //             text += `${firstLine}\n`;
    //         } else {
    //             // Si el nombre cabe en la línea
    //             const paddedName = name.padEnd(maxNameLength, ' ');
    //             text += `${quantity.padEnd(3, ' ')}${paddedName}${price.padStart(8, ' ')}  ${total.padStart(8, ' ')}\n`;
    //         }
    //     }
    //     const lineWidth = 40; // Ajusta este valor según el ancho máximo de tu ticket (número de caracteres por línea)


    //     text += "========================================\n"; // Separador

    //     // Añadir total de la venta, alineado a la derecha
    //     text += rightAlignText(`Total:  ${totalF.toFixed(2)}`, lineWidth) + "\n";
    //     text += "-----------------------------------------\n"; // Separador

    //     // Añadir efectivo recibido y cambio, alineado a la derecha
    //     text += rightAlignText(`Efectivo:  ${cashReceived.toFixed(2)}`, lineWidth) + "\n";
    //     text += rightAlignText(`Su Cambio: ${change.toFixed(2)}`, lineWidth) + "\n";


       

    //     text += "-----------------------------------------\n"; // Separador
    //     text += "Una vez recibida la mercancía no se aceptan cambios ni devoluciones\n";
    //     text += "Este ticket no es una representación impresa de un CFDI\n";

    //     let encodedText = text //encodeURIComponent(text);
    //     let final = header + encodedText;

    //     return final;
    // }


    // generateVentaTicket(seller, route, data, totalF, cashReceived, change) {
    //     let header = 'rawbt:';
    //     let text = "             DISTRIBUIDORA ARCOX \n";
    //     text += "Gerente: Manuel Morales Arcos\n";
    //     text += "RFC. MOAM870216217\n";
    //     text += "Numero de contacto : 231-150-8427\n";
    //     text += "==========================================\n"; // Separador
    //     text += `Fecha:  ${new Date().toLocaleString()}\n`;
    //     text += `Vendedor: ${seller}\nRuta: ${route}\n`;
    //     text += "==========================================\n"; // Separador
    
    //     // Encabezados de las columnas
    //     text += "Cant.  Producto      P.Unitario  Subtotal\n";
    //     text += "-----------------------------------------\n"; // Línea bajo headers
    
    //     const maxNameLength = 19; // Ajustar para que se acomode a la estructura deseada
    
    //     for (let i = 0; i < data.length; i++) {
    //         const item = data[i];
    //         let name = sanitizeText(item.name);  // Sanitize el nombre del producto
    //         let quantity = item.quantity.toString();
    //         let price = (item.price - (item.discount ? item.discount : 0)).toFixed(2);
    //         let total = (price * item.quantity).toFixed(2);
    
    //         if (name.length > maxNameLength) {
    //             // Si el nombre del producto es muy largo, se divide en varias líneas
    //             let firstLine = `${quantity.padEnd(3, ' ')}${name.slice(0, maxNameLength).padEnd(maxNameLength, ' ')}`;
    //             firstLine += `${price.padStart(8, ' ')}  ${total.padStart(8, ' ')}`;
    //             let remainingText = name.slice(maxNameLength);
    
    //             // Manejo del texto que sobra
    //             while (remainingText.length > 0) {
    //                 let nextLine = remainingText.slice(0, maxNameLength);
    //                 remainingText = remainingText.slice(maxNameLength);
    //                 firstLine += `\n${" ".repeat(3)}${nextLine}`; // Añadir espacios al inicio de la línea
    //             }
    
    //             text += `${firstLine}\n`;
    //         } else {
    //             // Si el nombre cabe en la línea
    //             const paddedName = name.padEnd(maxNameLength, ' ');
    //             text += `${quantity.padEnd(3, ' ')}${paddedName}${price.padStart(8, ' ')}  ${total.padStart(8, ' ')}\n`;
    //         }
    //     }
    //     const lineWidth = 40; // Ajusta este valor según el ancho máximo de tu ticket (número de caracteres por línea)
    
    //     text += "========================================\n"; // Separador
    
    //     // Añadir total de la venta, alineado a la derecha
    //     text += rightAlignText(`Total:  ${totalF.toFixed(2)}`, lineWidth) + "\n";
    //     text += "-----------------------------------------\n"; // Separador
    
    //     // Añadir efectivo recibido y cambio, alineado a la derecha
    //     text += rightAlignText(`Efectivo:  ${cashReceived.toFixed(2)}`, lineWidth) + "\n";
    //     text += rightAlignText(`Su Cambio: ${change.toFixed(2)}`, lineWidth) + "\n";
    
    //     text += "-----------------------------------------\n"; // Separador
    //     text += "Una vez recibida la mercancía no se aceptan cambios ni devoluciones\n";
    //     text += "Este ticket no es una representación impresa de un CFDI\n";
    
    //     let encodedText = text; //encodeURIComponent(text);
    //     let final = header + encodedText;
    
    //     return final;
    // }
 generateVentaTicket(seller, route, data, totalF, cashReceived, change) {
    let header = 'rawbt:';
    let text = "             DISTRIBUIDORA ARCOX \n";
    text += "Gerente: Manuel Arcos\n";
    text += "RFC. MOAM870216217\n";
    text += "Numero de contacto : 231-150-8427\n";
    text += "==========================================\n"; // Separador
    text += `Fecha:  ${new Date().toLocaleString()}\n`;
    text += `Vendedor: ${seller}\nRuta: ${route}\n`;
    text += "==========================================\n"; // Separador

    // Encabezados de las columnas
    text += "Cant.  Producto      P.Unitario  Subtotal\n";
    text += "-----------------------------------------\n"; // Línea bajo headers

    const maxNameLength = 19; // Ajustar para que se acomode a la estructura deseada

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        let name = sanitizeText(item.name);  // Sanitize el nombre del producto
        let quantity = item.quantity.toString();
        let price = (item.price - (item.discount ? item.discount : 0)).toFixed(2);
        let total = (price * item.quantity).toFixed(2);

        // Usar breakTextByWord para dividir el nombre del producto sin cortar palabras
        let brokenName = breakTextByWord(name, maxNameLength);

        const lines = brokenName.split('\n');
        let firstLine = `${quantity.padEnd(3, ' ')}${lines[0].padEnd(maxNameLength, ' ')}`;
        firstLine += `${price.padStart(8, ' ')}  ${total.padStart(8, ' ')}`;
        
        text += `${firstLine}\n`;

        // Si hay más líneas, las añadimos debajo, con un indentado adecuado
        for (let j = 1; j < lines.length; j++) {
            text += `   ${lines[j]}\n`; // Añadir espacios al inicio de la línea para alinear las siguientes líneas
        }
    }
    
    const lineWidth = 40; // Ajusta este valor según el ancho máximo de tu ticket (número de caracteres por línea)

    text += "========================================\n"; // Separador

    // Añadir total de la venta, alineado a la derecha
    text += rightAlignText(`Total:  ${totalF.toFixed(2)}`, lineWidth) + "\n";
    text += "-----------------------------------------\n"; // Separador

    // Añadir efectivo recibido y cambio, alineado a la derecha
    text += rightAlignText(`Efectivo:  ${cashReceived.toFixed(2)}`, lineWidth) + "\n";
    text += rightAlignText(`Su Cambio: ${change.toFixed(2)}`, lineWidth) + "\n";

    text += "-----------------------------------------\n"; // Separador
    text += "Una vez recibida la mercancía no se aceptan cambios ni devoluciones\n";
    text += "Este ticket no es una representación impresa de un CFDI\n";

    let encodedText = text; //encodeURIComponent(text);
    let final = header + encodedText;

    return final;
}

};

export default TicketService;
