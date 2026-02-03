import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract, Property, User } from '../types';

/**
 * Gera um PDF de contrato de locação ou venda
 */
export const generateContractPDF = (
    contract: Contract,
    property: Property,
    tenant: User,
    owner: User
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Configurações de estilo
    const primaryColor: [number, number, number] = [43, 108, 238]; // #2b6cee
    const textColor: [number, number, number] = [17, 19, 24]; // #111318
    const grayColor: [number, number, number] = [148, 163, 184]; // #94a3b8

    // === CABEÇALHO ===
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE ' + (contract.type === 'rent' ? 'LOCAÇÃO' : 'COMPRA E VENDA'), pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Contrato Nº ${contract.id}`, pageWidth / 2, 25, { align: 'center' });

    // === INFORMAÇÕES DO IMÓVEL ===
    let yPos = 45;

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DADOS DO IMÓVEL', 14, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const propertyData = [
        ['Tipo:', property.type],
        ['Endereço:', property.location],
        ['Área:', `${property.area} m²`],
        ['Quartos:', property.beds.toString()],
        ['Banheiros:', property.baths.toString()],
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: propertyData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 'auto' }
        },
        margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // === PARTES CONTRATANTES ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. PARTES CONTRATANTES', 14, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('LOCADOR/VENDEDOR:', 14, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${owner.name}`, 14, yPos);
    yPos += 5;
    doc.text(`Email: ${owner.email}`, 14, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(contract.type === 'rent' ? 'LOCATÁRIO:' : 'COMPRADOR:', 14, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${tenant.name}`, 14, yPos);
    yPos += 5;
    doc.text(`Email: ${tenant.email}`, 14, yPos);

    // === CONDIÇÕES FINANCEIRAS ===
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. CONDIÇÕES FINANCEIRAS', 14, yPos);

    yPos += 8;
    const financialData = [
        ['Valor:', contract.value],
        ['Data de Início:', new Date(contract.startDate).toLocaleDateString('pt-BR')],
        ['Data de Término:', new Date(contract.endDate).toLocaleDateString('pt-BR')],
        ['Status:', contract.status === 'active' ? 'Ativo' : contract.status === 'completed' ? 'Concluído' : contract.status === 'expiring' ? 'Expirando' : contract.status === 'late' ? 'Atrasado' : 'Rascunho'],
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: financialData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 'auto' }
        },
        margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // === CLÁUSULAS ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. CLÁUSULAS CONTRATUAIS', 14, yPos);

    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const clauses = contract.type === 'rent'
        ? [
            'CLÁUSULA 1ª - O presente contrato tem por objeto a locação do imóvel descrito acima.',
            'CLÁUSULA 2ª - O prazo de locação é de 12 (doze) meses, podendo ser prorrogado mediante acordo entre as partes.',
            'CLÁUSULA 3ª - O locatário se compromete a utilizar o imóvel exclusivamente para fins residenciais.',
            'CLÁUSULA 4ª - O pagamento do aluguel deverá ser efetuado até o dia 10 de cada mês.',
            'CLÁUSULA 5ª - O locatário é responsável pelo pagamento de contas de água, luz e gás.',
        ]
        : [
            'CLÁUSULA 1ª - O presente contrato tem por objeto a compra e venda do imóvel descrito acima.',
            'CLÁUSULA 2ª - O comprador se compromete a pagar o valor integral conforme acordado.',
            'CLÁUSULA 3ª - O vendedor garante que o imóvel está livre de ônus e dívidas.',
            'CLÁUSULA 4ª - A escritura pública será lavrada em até 30 dias após a assinatura deste contrato.',
            'CLÁUSULA 5ª - As despesas com escritura e registro serão divididas igualmente entre as partes.',
        ];

    clauses.forEach((clause, index) => {
        const lines = doc.splitTextToSize(clause, pageWidth - 28);
        doc.text(lines, 14, yPos);
        yPos += lines.length * 5 + 3;
    });

    // === ASSINATURAS ===
    yPos += 15;

    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Linha de assinatura do Locador/Vendedor
    doc.line(14, yPos, 90, yPos);
    doc.text(owner.name, 14, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Locador/Vendedor', 14, yPos + 10);

    // Linha de assinatura do Locatário/Comprador
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.line(pageWidth - 90, yPos, pageWidth - 14, yPos);
    doc.text(tenant.name, pageWidth - 90, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(contract.type === 'rent' ? 'Locatário' : 'Comprador', pageWidth - 90, yPos + 10);

    // === RODAPÉ ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text(
            `Gerado via EstateFlow - ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Salvar o PDF
    const fileName = `Contrato_${contract.type === 'rent' ? 'Locacao' : 'Venda'}_${contract.id}.pdf`;
    doc.save(fileName);
};
