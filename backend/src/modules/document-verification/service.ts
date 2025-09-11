// src/modules/document-verification/service.ts
import { Logger } from "@medusajs/framework/types";
import OpenAI from "openai";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import {
  DocumentType,
  VerificationResult,
  BothSidesVerificationResult,
} from "./types";
import { validationHelpers } from "../../admin/routes/financing/utils/validationHelpers";

type InjectedDependencies = {
  logger: Logger;
};

export class DocumentVerificationModuleService {
  protected logger_: Logger;
  private openai: OpenAI;
  private sharedAssistant: any = null; // Assistant reutilizable
  private assistantInitialized = false;

  constructor({ logger }: InjectedDependencies) {
    this.logger_ = logger;

    if (!process.env.OPENAI_API_KEY) {
      this.logger_.warn("⚠️ OPENAI_API_KEY no está configurada");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // ✅ CREAR O REUTILIZAR ASSISTANT COMPARTIDO
  private async getOrCreateSharedAssistant() {
    if (this.sharedAssistant && this.assistantInitialized) {
      this.logger_.info("♻️ Reutilizando assistant existente");
      return this.sharedAssistant;
    }

    try {
      this.logger_.info(
        "🆕 Creando assistant compartido para análisis de documentos..."
      );

      this.sharedAssistant = await this.openai.beta.assistants.create({
        name: "Document Analyzer Shared",
        instructions: `Eres un experto analizador de documentos españoles especializado en:
        - DNI y NIE (anverso y reverso)
        - Nóminas españolas (PDF e imágenes)
        - Documentos bancarios (certificados y extractos)
        - Justificantes de pensión y paro
        
        SIEMPRE responde con JSON válido según el formato solicitado.
        Nunca agregues texto antes o después del JSON.
        Eres preciso, confiable y detectas falsificaciones.`,
        model: "gpt-4o",
        tools: [{ type: "file_search" }],
      });

      this.assistantInitialized = true;
      this.logger_.info(
        `✅ Assistant compartido creado: ${this.sharedAssistant.id}`
      );

      return this.sharedAssistant;
    } catch (error: any) {
      this.logger_.error(
        `❌ Error creando assistant compartido: ${error.message}`
      );
      throw error;
    }
  }

  async verifyIdentityDocument(
    imageBase64: string,
    documentSide: "front" | "back"
  ): Promise<VerificationResult> {
    try {
      this.logger_.info(`🔍 Verificando ${documentSide} del DNI/NIE...`);

      const frontPrompt = `Analiza esta imagen del ANVERSO de un DNI o NIE español y extrae la siguiente información:

VALIDACIONES IMPORTANTES:
1. ¿Es un DNI o NIE español válido y legible?
2. ¿Está la foto de la persona presente y visible?
3. ¿Los textos están claramente legibles sin borrosidad?
4. ¿Los colores y formato coinciden con un DNI o NIE español real?
5. ¿Hay signos de falsificación, manipulación o edición digital?

INFORMACIÓN A EXTRAER:
- Nombre completo de la persona
- Número de documento (formato DNI: 12345678X o formato NIE: X1234567L/Y1234567L/Z1234567L)
- Fecha de nacimiento
- Sexo (H/M)
- Nacionalidad`;

      // ✅ NUEVO PROMPT ESPECÍFICO PARA REVERSO
      const backPrompt = `Analiza esta imagen del REVERSO de un DNI o NIE español y busca ESPECÍFICAMENTE estos elementos:

🎯 DATOS CLAVE A EXTRAER DEL REVERSO DNI/NIE ESPAÑOL:

1. **NÚMERO DE EQUIPO**: Busca texto como "EQUIPO" seguido de números/letras (ej: "30331L601", "12345A123")
2. **DOMICILIO/DIRECCIÓN**: Busca direcciones de oficinas o domicilios mencionados
3. **LUGAR DE NACIMIENTO**: Puede aparecer como ubicación o referencia geográfica
4. **TEXTO OFICIAL**: Busca frases como "DOCUMENTO NACIONAL DE IDENTIDAD", "NÚMERO DE IDENTIDAD DE EXTRANJERO", "DIRECCIÓN GENERAL", etc.

🔍 ELEMENTOS VISUALES A VERIFICAR:
- Gradientes de colores (naranjas, amarillos, azules típicos del DNI/NIE)
- Códigos de barras o elementos gráficos
- Diseño oficial con texto en español
- Formato de tarjeta oficial

⚠️ IMPORTANTE: 
- El reverso NO tiene foto de persona
- El reverso NO tiene fechas de expedición/caducidad  
- El reverso SÍ tiene información de oficinas y códigos
- NIE y DNI tienen el mismo formato de reverso

CRITERIOS DE VALIDACIÓN:
✅ VÁLIDO si encuentra:
- Número de EQUIPO claro
- O direcciones oficiales en español
- O diseño oficial reconocible del DNI/NIE
- O texto oficial del Ministerio del Interior

❌ INVÁLIDO solo si:
- Es claramente otra cosa (pasaporte, carnet, foto personal, etc.)
- No tiene ningún elemento típico del reverso DNI/NIE`;

      const prompt = documentSide === "front" ? frontPrompt : backPrompt;

      // ✅ FORMATO JSON ESPECÍFICO PARA EL REVERSO
      const frontJsonFormat = `{
  "isValid": false,
  "extractedData": {
    "fullName": null,
    "documentNumber": null,
    "birthDate": null,
    "nationality": null
    "sex": null,
  },
  "confidence": 0,
  "issues": ["La imagen no es un DNI válido o no se puede procesar"],
  "imageQuality": "poor"
}`;

      const backJsonFormat = `{
  "isValid": true,
  "extractedData": {
    "documentSide": "back",
    "equipmentNumber": "30331L601",
    "hasOfficialText": true,
    "hasOfficialDesign": true,
    "addresses": ["direcciones encontradas"],
    "birthPlace": "lugar si se encuentra"
  },
  "confidence": 85,
  "issues": [],
  "imageQuality": "good"
}`;

      const jsonFormat =
        documentSide === "front" ? frontJsonFormat : backJsonFormat;

      // ✅ SISTEMA DE MENSAJES ESPECÍFICO
      const systemMessage =
        documentSide === "front"
          ? `Eres un experto en verificación del ANVERSO de documentos DNI y NIE españoles. 
         Conoces perfectamente los formatos de ambos documentos y sus diferencias.
         SIEMPRE responde con JSON válido, sin excepción.`
          : `Eres un experto en verificación del REVERSO de documentos DNI y NIE españoles.
         
         MISIÓN: Buscar el NÚMERO DE EQUIPO, direcciones, y elementos oficiales.
         
         El reverso del DNI y NIE español SIEMPRE tiene:
         - Número de EQUIPO (código alfanumérico)
         - Información de oficinas/direcciones
         - Diseño oficial con gradientes
         - Texto del Ministerio del Interior
         - Ambos documentos tienen el mismo formato de reverso
         
         SIEMPRE responde con JSON válido, sin excepción.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt}

FORMATO DE RESPUESTA OBLIGATORIO - USA ESTA ESTRUCTURA:

${jsonFormat}

${
  documentSide === "back"
    ? `
🎯 INSTRUCCIONES ESPECÍFICAS PARA REVERSO:
- Busca CUALQUIER número después de "EQUIPO" 
- Si encuentras el número de equipo = VÁLIDO automáticamente
- Si ves direcciones oficiales = VÁLIDO  
- Si ves diseño oficial DNI/NIE = VÁLIDO
- confidence entre 80-95 si encuentras datos clave
- confidence 60-75 si solo ves diseño oficial
- SOLO marca como inválido si es obviamente otra cosa

EJEMPLO de lo que buscas:
- "EQUIPO 30331L601" ← ESTO ES CLAVE
- Direcciones de oficinas en español
- Texto oficial del gobierno
- "DOCUMENTO NACIONAL DE IDENTIDAD" o "NÚMERO DE IDENTIDAD DE EXTRANJERO"
`
    : `
- Si la imagen SÍ es un DNI o NIE válido, cambia isValid a true y completa los datos
- Para DNI: formato 12345678X (8 números + 1 letra)
- Para NIE: formato X1234567L, Y1234567L o Z1234567L (letra + 7 números + 1 letra)
- confidence debe ser un NÚMERO ENTERO entre 0 y 100
`
}
- NUNCA agregues texto antes o después del JSON
- NUNCA uses markdown o bloques de código`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content?.trim();

      if (!content) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      // ✅ LOGGING COMPLETO
      this.logger_.info(
        `📄 ========== RESPUESTA COMPLETA DE OPENAI ==========`
      );
      this.logger_.info(content);
      this.logger_.info(`📄 ================================================`);

      let result: VerificationResult;
      try {
        let cleanContent = content;

        if (!cleanContent.startsWith("{")) {
          const jsonStart = cleanContent.indexOf("{");
          const jsonEnd = cleanContent.lastIndexOf("}");

          if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
          }
        }

        result = JSON.parse(cleanContent);

        if (
          !result.hasOwnProperty("isValid") ||
          !result.hasOwnProperty("confidence")
        ) {
          throw new Error("Estructura JSON inválida");
        }

        // ✅ VALIDACIÓN ADICIONAL PARA EL REVERSO
        if (documentSide === "back" && result.extractedData) {
          // Si encuentra número de equipo, automáticamente válido
          if (result.extractedData.equipmentNumber) {
            result.isValid = true;
            if (result.confidence < 70) {
              result.confidence = 80; // Aumentar confianza si encuentra equipo
            }
            this.logger_.info(
              `🎯 EQUIPO encontrado: ${result.extractedData.equipmentNumber} - FORZANDO VÁLIDO`
            );
          }

          // Si tiene diseño oficial, probablemente válido
          if (
            result.extractedData.hasOfficialDesign &&
            result.confidence < 60
          ) {
            result.confidence = 70;
            this.logger_.info(
              `🎨 Diseño oficial detectado - AUMENTANDO CONFIANZA`
            );
          }
        }

        // ✅ VALIDACIÓN DE EDAD PARA DNI FRONT
        if (
          documentSide === "front" &&
          result.extractedData &&
          result.isValid
        ) {
          this.logger_.info(
            `📅 Fecha nacimiento RAW: "${result.extractedData.birthDate}"`
          );

          // Test manual del cálculo de edad
          const manualAge = validationHelpers.calculateAge(
            result.extractedData.birthDate
          );
          this.logger_.info(`🧮 Edad calculada manualmente: ${manualAge}`);

          const ageValidation = validationHelpers.validateAgeFromDNI(
            result.extractedData
          );

          if (!ageValidation.isValid) {
            result.isValid = false;
            result.confidence = 0;
            result.issues = result.issues || [];
            result.issues.push(
              ageValidation.message || "Edad insuficiente para financiación"
            );

            this.logger_.info(`🚫 EDAD INSUFICIENTE: ${ageValidation.message}`);
            this.logger_.info(
              `📅 Fecha nacimiento extraída: ${result.extractedData.birthDate}`
            );
          } else {
            this.logger_.info(`✅ EDAD VALIDADA: ${ageValidation.message}`);
          }
        }
      } catch (parseError: any) {
        this.logger_.error(
          `❌ Error parseando JSON de OpenAI: ${parseError?.message}`
        );
        this.logger_.error(`📄 Contenido recibido: ${content}`);

        // ✅ FALLBACK ESPECÍFICO PARA REVERSO
        if (documentSide === "back") {
          this.logger_.info("🔄 APLICANDO FALLBACK ESPECÍFICO PARA REVERSO");
          return {
            isValid: true, // Asumimos válido en caso de error de parsing
            extractedData: {
              //@ts-ignore
              documentSide: "back",
              fallbackUsed: true,
              parsingError: true,
            },
            confidence: 65,
            issues: [
              "Error parseando respuesta - aplicado fallback permisivo para reverso",
            ],
            imageQuality: "fair",
          };
        }

        return {
          isValid: false,
          extractedData: {},
          confidence: 0,
          issues: ["Error al procesar la respuesta del análisis"],
          imageQuality: "poor",
        };
      }

      // ✅ LOGGING DETALLADO
      this.logger_.info(
        `✅ Verificación completada: ${
          result.isValid ? "VÁLIDO" : "INVÁLIDO"
        } (${result.confidence}% confianza)`
      );
      this.logger_.info(`📊 Calidad de imagen: ${result.imageQuality}`);

      // Mostrar datos específicos del reverso
      if (documentSide === "back" && result.extractedData) {
        this.logger_.info(`📋 ========== DATOS DEL REVERSO ==========`);
        if (result.extractedData.equipmentNumber)
          this.logger_.info(
            `   🎯 EQUIPO: ${result.extractedData.equipmentNumber}`
          );
        if (result.extractedData.addresses)
          this.logger_.info(
            `   🏠 Direcciones: ${JSON.stringify(
              result.extractedData.addresses
            )}`
          );
        if (result.extractedData.birthPlace)
          this.logger_.info(
            `   🌍 Lugar nacimiento: ${result.extractedData.birthPlace}`
          );
        if (result.extractedData.hasOfficialDesign)
          this.logger_.info(
            `   🎨 Diseño oficial: ${result.extractedData.hasOfficialDesign}`
          );
        this.logger_.info(`📋 ====================================`);
      }

      if (result.issues && result.issues.length > 0) {
        this.logger_.info(`📋 ========== RAZONES DE RECHAZO ==========`);
        result.issues.forEach((issue, index) => {
          this.logger_.info(`   ${index + 1}. ${issue}`);
        });
        this.logger_.info(`📋 =========================================`);
      }

      return result;
    } catch (error: any) {
      this.logger_.error(
        `❌ Error en verificación de DNI/NIE: ${error?.message || error}`
      );

      // ✅ FALLBACK PERMISIVO PARA REVERSO EN CASO DE ERROR TÉCNICO
      if (documentSide === "back") {
        this.logger_.info("🔄 ERROR TÉCNICO - FALLBACK PERMISIVO PARA REVERSO");
        return {
          isValid: true,
          extractedData: {
            //@ts-ignore
            documentSide: "back",
            technicalErrorFallback: true,
          },
          confidence: 60,
          issues: [
            "Error técnico - aplicado fallback permisivo para reverso DNI/NIE",
          ],
          imageQuality: "fair",
        };
      }

      return {
        isValid: false,
        extractedData: {},
        confidence: 0,
        issues: ["Error técnico al procesar la imagen"],
        imageQuality: "poor",
      };
    }
  }

  async verifyDocument(
    imageBase64: string,
    documentType: DocumentType
  ): Promise<VerificationResult> {
    this.logger_.info(`🔍 Verificando documento tipo: ${documentType}`);

    switch (documentType) {
      case "dni_front":
        return this.verifyIdentityDocument(imageBase64, "front");
      case "dni_back":
        return this.verifyIdentityDocument(imageBase64, "back");
      case "bank_certificate":
      case "bank_statement":
        return this.verifyBankDocument(imageBase64, documentType);
      case "payroll":
        return this.verifyPayrollDocument(imageBase64);
      default:
        throw new Error(`Tipo de documento no soportado: ${documentType}`);
    }
  }

  async verifyBankDocument(
    documentBase64: string,
    documentType: "bank_certificate" | "bank_statement"
  ): Promise<VerificationResult> {
    try {
      this.logger_.info(
        `🏦 Verificando documento bancario: ${documentType}...`
      );

      // Detectar si es PDF o imagen
      const buffer = Buffer.from(documentBase64, "base64");
      const formatInfo = this.detectFileFormatFromBuffer(buffer);

      this.logger_.info(
        `📄 Formato detectado: ${formatInfo.mimeType} (método: ${formatInfo.method})`
      );

      // Si es PDF, usar OpenAI File API como en payroll
      if (formatInfo.mimeType === "application/pdf") {
        this.logger_.info(
          "📄 Detectado PDF, procesando con OpenAI File API..."
        );
        return await this.processPdfBank(documentBase64, documentType);
      }

      // Para imágenes, definir variables necesarias
      const finalMimeType = formatInfo.mimeType;
      const finalBase64 = documentBase64;

      const prompt = `Analiza este documento de un ${
        documentType === "bank_certificate"
          ? "certificado bancario"
          : "extracto bancario"
      } y extrae la siguiente información:

VALIDACIONES IMPORTANTES:
1. ¿Es un documento bancario oficial válido y legible?
2. ¿Contiene el logo o membrete de un banco reconocido?
3. ¿Los textos están claramente legibles sin borrosidad?
4. ¿Tiene formato oficial de documento bancario?
5. ¿Hay signos de falsificación, manipulación o edición digital?

INFORMACIÓN A EXTRAER:
- Nombre del banco
- Titular de la cuenta
- IBAN o número de cuenta
- Tipo de documento (certificado/extracto)
- Fecha de emisión
- Saldo o balance (si aplica)`;

      const jsonFormat = `{
  "isValid": false,
  "extractedData": {
    "bankName": null,
    "accountHolder": null,
    "iban": null,
    "accountNumber": null,
    "documentType": "${documentType}",
    "issueDate": null,
    "balance": null
  },
  "confidence": 0,
  "issues": ["La imagen no es un documento bancario válido o no se puede procesar"],
  "imageQuality": "poor"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Eres un experto en verificación de documentos bancarios españoles. 
             SIEMPRE responde con JSON válido, sin excepción.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt}

FORMATO DE RESPUESTA OBLIGATORIO - USA ESTA ESTRUCTURA:

${jsonFormat}

- Si el documento SÍ es un documento bancario válido, cambia isValid a true y completa los datos
- confidence debe ser un NÚMERO ENTERO entre 0 y 100
- NUNCA agregues texto antes o después del JSON
- NUNCA uses markdown o bloques de código`,
              },
              {
                type: "image_url",
                image_url: {
                  //@ts-ignore
                  url: `data:${finalMimeType};base64,${finalBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content?.trim();

      if (!content) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      this.logger_.info(
        `📄 Respuesta de OpenAI para documento bancario: ${content}`
      );

      let result: VerificationResult;
      try {
        result = JSON.parse(content);
      } catch (parseError: any) {
        this.logger_.error(`❌ Error parseando JSON: ${parseError?.message}`);
        return {
          isValid: false,
          extractedData: {},
          confidence: 0,
          issues: ["Error al procesar la respuesta del análisis"],
          imageQuality: "poor",
        };
      }

      this.logger_.info(
        `✅ Verificación documento bancario completada: ${
          result.isValid ? "VÁLIDO" : "INVÁLIDO"
        } (${result.confidence}% confianza)`
      );

      return result;
    } catch (error: any) {
      this.logger_.error(
        `❌ Error en verificación de documento bancario: ${
          error?.message || error
        }`
      );

      return {
        isValid: false,
        extractedData: {},
        confidence: 0,
        issues: ["Error técnico al procesar la imagen"],
        imageQuality: "poor",
      };
    }
  }

  async verifyPayrollDocument(
    documentBase64: string
  ): Promise<VerificationResult> {
    try {
      this.logger_.info(`💼 Verificando nómina...`);

      // Detectar si es PDF o imagen
      const buffer = Buffer.from(documentBase64, "base64");
      const formatInfo = this.detectFileFormatFromBuffer(buffer);

      this.logger_.info(
        `📄 Formato detectado: ${formatInfo.mimeType} (método: ${formatInfo.method})`
      );

      // Si es PDF, usar método especial de OpenAI
      if (formatInfo.mimeType === "application/pdf") {
        return await this.processPdfPayroll(documentBase64);
      }

      // Para imágenes, usar el método tradicional
      const prompt = `Analiza este documento de una nómina española y extrae la siguiente información:

VALIDACIONES IMPORTANTES:
1. ¿Es una nómina oficial válida y legible?
2. ¿Contiene el membrete o datos de la empresa empleadora?
3. ¿Los textos están claramente legibles sin borrosidad?
4. ¿Tiene formato oficial de nómina española?
5. ¿Contiene los conceptos típicos de una nómina (salario bruto, retenciones, cotizaciones, etc.)?
6. ¿Hay signos de falsificación, manipulación o edición digital?

INFORMACIÓN A EXTRAER:
- Nombre completo del empleado
- Nombre de la empresa empleadora
- Dirección de la empresa
- Período de la nómina (mes/año)
- Salario bruto
- Salario neto
- Número de la Seguridad Social
- Fecha de pago
- Horas trabajadas
- Puesto de trabajo
- Departamento
- Retenciones fiscales
- Cotizaciones a la Seguridad Social`;

      const jsonFormat = `{
  "isValid": false,
  "extractedData": {
    "employeeName": null,
    "employerName": null,
    "employerAddress": null,
    "payrollPeriod": null,
    "grossSalary": null,
    "netSalary": null,
    "socialSecurityNumber": null,
    "paymentDate": null,
    "workingHours": null,
    "jobTitle": null,
    "department": null,
    "taxWithholdings": null,
    "socialSecurityContributions": null,
    "hasOfficialPayrollFormat": false
  },
  "confidence": 0,
  "issues": ["La imagen no es una nómina válida o no se puede procesar"],
  "imageQuality": "poor"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Eres un experto en verificación de nóminas españolas. 
             Conoces perfectamente el formato oficial de las nóminas, los conceptos salariales,
             retenciones fiscales y cotizaciones sociales típicas en España.
             SIEMPRE responde con JSON válido, sin excepción.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt}

FORMATO DE RESPUESTA OBLIGATORIO - USA ESTA ESTRUCTURA:

${jsonFormat}

INSTRUCCIONES ESPECÍFICAS PARA NÓMINAS:
- Si encuentras datos de empleado y empleador = VÁLIDO automáticamente
- Si ves conceptos salariales típicos (bruto, neto, retenciones) = VÁLIDO
- Si tiene formato oficial de nómina = confidence entre 80-95
- Si solo ves algunos datos pero formato correcto = confidence 60-75
- SOLO marca como inválido si es obviamente otra cosa

CONCEPTOS CLAVE A BUSCAR:
- Salario Base, Complementos, Pagas Extra
- IRPF (retención fiscal)
- Cotización SS (Seguridad Social)
- Desempleo, Formación Profesional
- Total Devengado, Total Deducciones
- Líquido a Percibir

- Si el documento SÍ es una nómina válida, cambia isValid a true y completa los datos
- confidence debe ser un NÚMERO ENTERO entre 0 y 100
- NUNCA agregues texto antes o después del JSON
- NUNCA uses markdown o bloques de código`,
              },
              {
                type: "image_url",
                image_url: {
                  //@ts-ignore
                  url: `data:${finalMimeType};base64,${finalBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content?.trim();

      if (!content) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      this.logger_.info(
        `📄 ========== RESPUESTA COMPLETA DE OPENAI (NÓMINA) ==========`
      );
      this.logger_.info(content);
      this.logger_.info(`📄 ================================================`);

      let result: VerificationResult;
      try {
        let cleanContent = content;

        if (!cleanContent.startsWith("{")) {
          const jsonStart = cleanContent.indexOf("{");
          const jsonEnd = cleanContent.lastIndexOf("}");

          if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
          }
        }

        result = JSON.parse(cleanContent);

        if (
          !result.hasOwnProperty("isValid") ||
          !result.hasOwnProperty("confidence")
        ) {
          throw new Error("Estructura JSON inválida");
        }

        // Validación adicional para nóminas
        if (result.extractedData) {
          // Si encuentra datos básicos de empleado y empleador, muy probable que sea válido
          if (
            result.extractedData.employeeName &&
            result.extractedData.employerName
          ) {
            result.isValid = true;
            if (result.confidence < 70) {
              result.confidence = 80;
            }
            this.logger_.info(
              `👤 Empleado y empleador encontrados - FORZANDO VÁLIDO`
            );
          }

          // Si encuentra salarios, probablemente válido
          if (
            result.extractedData.grossSalary &&
            result.extractedData.netSalary
          ) {
            result.isValid = true;
            if (result.confidence < 75) {
              result.confidence = 85;
            }
            this.logger_.info(`💰 Salarios encontrados - AUMENTANDO CONFIANZA`);
          }

          // Si tiene formato oficial de nómina
          if (
            result.extractedData.hasOfficialPayrollFormat &&
            result.confidence < 60
          ) {
            result.confidence = 70;
            this.logger_.info(
              `📋 Formato oficial detectado - AUMENTANDO CONFIANZA`
            );
          }
        }
      } catch (parseError: any) {
        this.logger_.error(
          `❌ Error parseando JSON de OpenAI: ${parseError?.message}`
        );
        this.logger_.error(`📄 Contenido recibido: ${content}`);

        return {
          isValid: false,
          extractedData: {},
          confidence: 0,
          issues: ["Error al procesar la respuesta del análisis"],
          imageQuality: "poor",
        };
      }

      this.logger_.info(
        `✅ Verificación nómina completada: ${
          result.isValid ? "VÁLIDO" : "INVÁLIDO"
        } (${result.confidence}% confianza)`
      );

      // Logging detallado de datos extraídos
      if (result.extractedData) {
        this.logger_.info(`📋 ========== DATOS DE LA NÓMINA ==========`);
        if (result.extractedData.employeeName)
          this.logger_.info(
            `   👤 Empleado: ${result.extractedData.employeeName}`
          );
        if (result.extractedData.employerName)
          this.logger_.info(
            `   🏢 Empresa: ${result.extractedData.employerName}`
          );
        if (result.extractedData.payrollPeriod)
          this.logger_.info(
            `   📅 Período: ${result.extractedData.payrollPeriod}`
          );
        if (result.extractedData.grossSalary)
          this.logger_.info(
            `   💰 Salario bruto: ${result.extractedData.grossSalary}`
          );
        if (result.extractedData.netSalary)
          this.logger_.info(
            `   💵 Salario neto: ${result.extractedData.netSalary}`
          );
        if (result.extractedData.jobTitle)
          this.logger_.info(`   💼 Puesto: ${result.extractedData.jobTitle}`);
        this.logger_.info(`📋 =====================================`);
      }

      if (result.issues && result.issues.length > 0) {
        this.logger_.info(`📋 ========== RAZONES DE RECHAZO ==========`);
        result.issues.forEach((issue, index) => {
          this.logger_.info(`   ${index + 1}. ${issue}`);
        });
        this.logger_.info(`📋 =========================================`);
      }

      return result;
    } catch (error: any) {
      this.logger_.error(
        `❌ Error en verificación de nómina: ${error?.message || error}`
      );

      return {
        isValid: false,
        extractedData: {},
        confidence: 0,
        issues: ["Error técnico al procesar la imagen"],
        imageQuality: "poor",
      };
    }
  }

  private async processPdfPayroll(
    pdfBase64: string
  ): Promise<VerificationResult> {
    try {
      this.logger_.info("📄 Procesando nómina en PDF con OpenAI File API...");

      const prompt = `Analiza este documento PDF de una nómina española y extrae la siguiente información:

VALIDACIONES IMPORTANTES:
1. ¿Es una nómina oficial válida y legible?
2. ¿Contiene el membrete o datos de la empresa empleadora?
3. ¿Los textos están claramente legibles sin borrosidad?
4. ¿Tiene formato oficial de nómina española?
5. ¿Contiene los conceptos típicos de una nómina (salario bruto, retenciones, cotizaciones, etc.)?
6. ¿Hay signos de falsificación, manipulación o edición digital?

INFORMACIÓN A EXTRAER:
- Nombre completo del empleado
- Nombre de la empresa empleadora
- Dirección de la empresa
- Período de la nómina (mes/año)
- Salario bruto
- Salario neto
- Número de la Seguridad Social
- Fecha de pago
- Horas trabajadas
- Puesto de trabajo
- Departamento
- Retenciones fiscales
- Cotizaciones a la Seguridad Social`;

      const jsonFormat = `{
  "isValid": false,
  "extractedData": {
    "employeeName": null,
    "employerName": null,
    "employerAddress": null,
    "payrollPeriod": null,
    "grossSalary": null,
    "netSalary": null,
    "socialSecurityNumber": null,
    "paymentDate": null,
    "workingHours": null,
    "jobTitle": null,
    "department": null,
    "taxWithholdings": null,
    "socialSecurityContributions": null,
    "hasOfficialPayrollFormat": false
  },
  "confidence": 0,
  "issues": ["La imagen no es una nómina válida o no se puede procesar"],
  "imageQuality": "poor"
}`;

      const fullPrompt = `${prompt}

FORMATO DE RESPUESTA OBLIGATORIO - USA ESTA ESTRUCTURA JSON:

${jsonFormat}

INSTRUCCIONES ESPECÍFICAS PARA NÓMINAS:
- Si encuentras datos de empleado y empleador = VÁLIDO automáticamente
- Si ves conceptos salariales típicos (bruto, neto, retenciones) = VÁLIDO
- Si tiene formato oficial de nómina = confidence entre 80-95
- Si solo ves algunos datos pero formato correcto = confidence 60-75
- SOLO marca como inválido si es obviamente otra cosa

CONCEPTOS CLAVE A BUSCAR:
- Salario Base, Complementos, Pagas Extra
- IRPF (retención fiscal)
- Cotización SS (Seguridad Social)
- Desempleo, Formación Profesional
- Total Devengado, Total Deducciones
- Líquido a Percibir

- Si el documento SÍ es una nómina válida, cambia isValid a true y completa los datos
- confidence debe ser un NÚMERO ENTERO entre 0 y 100
- NUNCA agregues texto antes o después del JSON
- NUNCA uses markdown o bloques de código`;

      const response = await this.analyzePdfWithOpenAI(pdfBase64, fullPrompt);

      // Procesar respuesta
      let result: VerificationResult;
      try {
        let cleanContent = response;

        if (!cleanContent.startsWith("{")) {
          const jsonStart = cleanContent.indexOf("{");
          const jsonEnd = cleanContent.lastIndexOf("}");

          if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
          }
        }

        result = JSON.parse(cleanContent);

        if (
          !result.hasOwnProperty("isValid") ||
          !result.hasOwnProperty("confidence")
        ) {
          throw new Error("Estructura JSON inválida");
        }

        // Validación adicional para nóminas
        if (result.extractedData) {
          if (
            result.extractedData.employeeName &&
            result.extractedData.employerName
          ) {
            result.isValid = true;
            if (result.confidence < 70) {
              result.confidence = 80;
            }
            this.logger_.info(
              `👤 Empleado y empleador encontrados - FORZANDO VÁLIDO`
            );
          }

          if (
            result.extractedData.grossSalary &&
            result.extractedData.netSalary
          ) {
            result.isValid = true;
            if (result.confidence < 75) {
              result.confidence = 85;
            }
            this.logger_.info(`💰 Salarios encontrados - AUMENTANDO CONFIANZA`);
          }

          if (
            result.extractedData.hasOfficialPayrollFormat &&
            result.confidence < 60
          ) {
            result.confidence = 70;
            this.logger_.info(
              `📋 Formato oficial detectado - AUMENTANDO CONFIANZA`
            );
          }
        }
      } catch (parseError: any) {
        this.logger_.error(
          `❌ Error parseando JSON de PDF: ${parseError?.message}`
        );
        return {
          isValid: false,
          extractedData: {},
          confidence: 0,
          issues: ["Error al procesar la respuesta del análisis del PDF"],
          imageQuality: "poor",
        };
      }

      this.logger_.info(
        `✅ Verificación PDF completada: ${
          result.isValid ? "VÁLIDO" : "INVÁLIDO"
        } (${result.confidence}% confianza)`
      );

      // Logging detallado de datos extraídos
      if (result.extractedData) {
        this.logger_.info(`📋 ========== DATOS DE LA NÓMINA PDF ==========`);
        if (result.extractedData.employeeName)
          this.logger_.info(
            `   👤 Empleado: ${result.extractedData.employeeName}`
          );
        if (result.extractedData.employerName)
          this.logger_.info(
            `   🏢 Empresa: ${result.extractedData.employerName}`
          );
        if (result.extractedData.payrollPeriod)
          this.logger_.info(
            `   📅 Período: ${result.extractedData.payrollPeriod}`
          );
        if (result.extractedData.grossSalary)
          this.logger_.info(
            `   💰 Salario bruto: ${result.extractedData.grossSalary}`
          );
        if (result.extractedData.netSalary)
          this.logger_.info(
            `   💵 Salario neto: ${result.extractedData.netSalary}`
          );
        if (result.extractedData.jobTitle)
          this.logger_.info(`   💼 Puesto: ${result.extractedData.jobTitle}`);
        this.logger_.info(`📋 =====================================`);
      }

      return result;
    } catch (error: any) {
      this.logger_.error(
        `❌ Error procesando nómina PDF: ${error?.message || error}`
      );
      return {
        isValid: false,
        extractedData: {},
        confidence: 0,
        issues: ["Error técnico al procesar el PDF"],
        imageQuality: "poor",
      };
    }
  }

  private async processPdfBank(
    pdfBase64: string,
    documentType: "bank_certificate" | "bank_statement"
  ): Promise<VerificationResult> {
    try {
      this.logger_.info(
        `📄 Procesando documento bancario PDF con OpenAI File API...`
      );

      const prompt = `Analiza este documento PDF de un ${
        documentType === "bank_certificate"
          ? "certificado bancario"
          : "extracto bancario"
      } español y extrae la siguiente información:

VALIDACIONES IMPORTANTES:
1. ¿Es un documento bancario oficial válido y legible?
2. ¿Contiene el logo o membrete de un banco reconocido?
3. ¿Los textos están claramente legibles sin borrosidad?
4. ¿Tiene formato oficial de documento bancario español?
5. ¿Contiene los elementos típicos de un documento bancario?
6. ¿Hay signos de falsificación, manipulación o edición digital?

INFORMACIÓN A EXTRAER:
- Nombre del banco
- Titular de la cuenta
- IBAN o número de cuenta
- Tipo de documento (certificado/extracto)
- Fecha de emisión
- Saldo o balance (si aplica)
- Dirección del banco
- Código SWIFT/BIC (si aplica)`;

      const jsonFormat = `{
  "isValid": false,
  "extractedData": {
    "bankName": null,
    "accountHolder": null,
    "iban": null,
    "accountNumber": null,
    "documentType": "${documentType}",
    "issueDate": null,
    "balance": null,
    "bankAddress": null,
    "swiftCode": null
  },
  "confidence": 0,
  "issues": ["El documento no es un documento bancario válido o no se puede procesar"],
  "imageQuality": "poor"
}`;

      const fullPrompt = `${prompt}

FORMATO DE RESPUESTA OBLIGATORIO - USA ESTA ESTRUCTURA JSON:

${jsonFormat}

INSTRUCCIONES ESPECÍFICAS PARA DOCUMENTOS BANCARIOS:
- Si encuentras nombre del banco y titular = VÁLIDO automáticamente
- Si ves IBAN o número de cuenta = VÁLIDO
- Si tiene formato oficial bancario = confidence entre 80-95
- Si solo ves algunos datos pero formato correcto = confidence 60-75
- SOLO marca como inválido si es obviamente otra cosa

ELEMENTOS CLAVE A BUSCAR:
- Logo bancario oficial
- Membrete del banco
- IBAN (ES + 22 dígitos)
- Nombre completo del titular
- Fecha de emisión del documento
- Sello o firma digital del banco

- Si el documento SÍ es un documento bancario válido, cambia isValid a true y completa los datos
- confidence debe ser un NÚMERO ENTERO entre 0 y 100
- NUNCA agregues texto antes o después del JSON
- NUNCA uses markdown o bloques de código`;

      const response = await this.analyzePdfWithOpenAI(pdfBase64, fullPrompt);

      // Procesar respuesta
      let result: VerificationResult;
      try {
        let cleanContent = response;

        if (!cleanContent.startsWith("{")) {
          const jsonStart = cleanContent.indexOf("{");
          const jsonEnd = cleanContent.lastIndexOf("}");

          if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
          }
        }

        // Mejorar limpieza de JSON para documentos bancarios
        try {
          result = JSON.parse(cleanContent);
        } catch (parseAttempt1) {
          // Intentar encontrar el primer JSON válido completo
          let bracketCount = 0;
          let validJsonEnd = -1;
          const jsonStart = cleanContent.indexOf("{");

          for (let i = jsonStart; i < cleanContent.length; i++) {
            if (cleanContent[i] === "{") bracketCount++;
            if (cleanContent[i] === "}") {
              bracketCount--;
              if (bracketCount === 0) {
                validJsonEnd = i;
                break;
              }
            }
          }

          if (validJsonEnd !== -1) {
            cleanContent = cleanContent.substring(jsonStart, validJsonEnd + 1);
            result = JSON.parse(cleanContent);
          } else {
            throw parseAttempt1;
          }
        }

        if (
          !result.hasOwnProperty("isValid") ||
          !result.hasOwnProperty("confidence")
        ) {
          throw new Error("Estructura JSON inválida");
        }

        if (
          typeof result.confidence !== "number" ||
          result.confidence < 0 ||
          result.confidence > 100
        ) {
          result.confidence = 50;
        }

        if (!result.extractedData) {
          result.extractedData = {};
        }

        if (!result.issues) {
          result.issues = [];
        }

        if (!result.imageQuality) {
          result.imageQuality =
            result.confidence > 80
              ? "excellent"
              : result.confidence > 60
              ? "good"
              : result.confidence > 40
              ? "fair"
              : "poor";
        }
      } catch (parseError: any) {
        this.logger_.error(
          `❌ Error parseando respuesta JSON del documento bancario: ${parseError?.message}`
        );
        this.logger_.error(
          `📄 Respuesta cruda recibida: ${response.substring(0, 500)}...`
        );
        result = {
          isValid: false,
          extractedData: {},
          confidence: 0,
          issues: ["Error al procesar la respuesta del análisis del PDF"],
          imageQuality: "poor",
        };
      }

      this.logger_.info(
        `✅ Verificación PDF bancario completada: ${
          result.isValid ? "VÁLIDO" : "INVÁLIDO"
        } (${result.confidence}% confianza)`
      );

      // Logging detallado de datos extraídos
      if (result.extractedData) {
        this.logger_.info(
          `🏦 ========== DATOS DEL DOCUMENTO BANCARIO ==========`
        );
        if (result.extractedData.bankName)
          this.logger_.info(`   🏛️ Banco: ${result.extractedData.bankName}`);
        if (result.extractedData.accountHolder)
          this.logger_.info(
            `   👤 Titular: ${result.extractedData.accountHolder}`
          );
        if (result.extractedData.iban)
          this.logger_.info(`   💳 IBAN: ${result.extractedData.iban}`);
        if (result.extractedData.issueDate)
          this.logger_.info(
            `   📅 Fecha emisión: ${result.extractedData.issueDate}`
          );
        if (result.extractedData.balance)
          this.logger_.info(`   💰 Saldo: ${result.extractedData.balance}`);
        this.logger_.info(`🏦 ==========================================`);
      }

      return result;
    } catch (error: any) {
      this.logger_.error(
        `❌ Error procesando documento bancario PDF: ${error?.message || error}`
      );
      return {
        isValid: false,
        extractedData: {},
        confidence: 0,
        issues: ["Error técnico al procesar el PDF"],
        imageQuality: "poor",
      };
    }
  }

  // ✅ ANÁLISIS DE PDF CON OPENAI FILE API
  private async analyzePdfWithOpenAI(
    pdfBase64: string,
    prompt: string
  ): Promise<any> {
    try {
      this.logger_.info("📄 Analizando PDF usando OpenAI File API...");

      // Crear archivo temporal
      const tempDir = process.env.TEMP || "/tmp";
      const tempFilePath = path.join(tempDir, `document_${Date.now()}.pdf`);

      // Escribir PDF a archivo temporal
      fs.writeFileSync(tempFilePath, Buffer.from(pdfBase64, "base64"));

      // Subir archivo a OpenAI
      const file = await this.openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: "assistants",
      });

      this.logger_.info(`📤 Archivo subido a OpenAI: ${file.id}`);

      // ✅ USAR ASSISTANT COMPARTIDO EN LUGAR DE CREAR UNO NUEVO
      const assistant = await this.getOrCreateSharedAssistant();

      // Crear hilo de conversación
      const { id: threadId } = await this.openai.beta.threads.create();

      this.logger_.info(`🧵 Thread creado: ${threadId}`);

      // Crear mensaje en el thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: prompt,
        attachments: [
          {
            file_id: file.id,
            tools: [{ type: "file_search" }],
          },
        ],
      });

      // Ejecutar análisis
      const { id: runId } = await this.openai.beta.threads.runs.create(
        threadId,
        {
          assistant_id: assistant.id,
        }
      );

      this.logger_.info(`🏃 Run creado: ${runId}`);

      // Usar método con fallback automático para compatibilidad
      let runStatus;
      try {
        //@ts-ignore
        runStatus = await this.openai.beta.threads.runs.retrieve(
          threadId,
          //@ts-ignore

          runId
        );
      } catch (retrieveError: any) {
        // Fallback automático para versión específica de la librería OpenAI
        try {
          runStatus = await this.openai.beta.threads.runs.retrieve(runId, {
            thread_id: threadId,
          });
        } catch (altError: any) {
          this.logger_.error(
            `❌ Error obteniendo estado del run: ${retrieveError.message}`
          );
          throw retrieveError;
        }
      }
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos máximo

      this.logger_.info(
        `⏳ Esperando resultado del análisis (estado inicial: ${runStatus.status})`
      );

      while (
        (runStatus.status === "queued" || runStatus.status === "in_progress") &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Actualizar estado del run con fallback automático
        try {
          //@ts-ignore
          runStatus = await this.openai.beta.threads.runs.retrieve(
            threadId,
            //@ts-ignore
            runId
          );
        } catch (loopRetrieveError: any) {
          // Fallback automático
          try {
            runStatus = await this.openai.beta.threads.runs.retrieve(runId, {
              thread_id: threadId,
            });
          } catch (altLoopError: any) {
            throw loopRetrieveError;
          }
        }
        attempts++;

        if (attempts % 5 === 0) {
          this.logger_.info(
            `⏳ Análisis en progreso... (intento ${attempts}/${maxAttempts}, estado: ${runStatus.status})`
          );
        }
      }

      this.logger_.info(
        `🏁 Análisis completado con estado: ${runStatus.status}`
      );

      if (runStatus.status === "completed") {
        const messages = await this.openai.beta.threads.messages.list(threadId);
        const response = messages.data[0].content[0];

        this.logger_.info(`📥 Respuesta recibida, tipo: ${response.type}`);

        // ✅ LIMPIAR RECURSOS PERO MANTENER EL ASSISTANT COMPARTIDO
        await this.cleanupOpenAIResources(file.id, null, threadId); // null = no eliminar assistant
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        // @ts-ignore
        return response.text?.value || "";
      } else if (runStatus.status === "failed") {
        this.logger_.error(
          `❌ Análisis falló: ${JSON.stringify(runStatus.last_error)}`
        );
        throw new Error(
          `Análisis falló: ${
            runStatus.last_error?.message || "Error desconocido"
          }`
        );
      } else if (attempts >= maxAttempts) {
        throw new Error(`Análisis expiró después de ${maxAttempts} segundos`);
      } else {
        throw new Error(
          `Análisis terminó con estado inesperado: ${runStatus.status}`
        );
      }
    } catch (error: any) {
      this.logger_.error(`❌ Error analizando PDF: ${error.message}`);

      // Intentar limpiar recursos incluso si hay error
      try {
        //@ts-ignore
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          //@ts-ignore
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        //@ts-ignore
        this.logger_.warn("Error limpiando archivo temporal:", cleanupError);
      }

      throw error;
    }
  }

  private async cleanupOpenAIResources(
    fileId: string,
    assistantId: string | null,
    threadId: string
  ) {
    try {
      this.logger_.info("🧹 Limpiando recursos de OpenAI...");

      const cleanupPromises = [];

      if (fileId) {
        cleanupPromises.push(
          //@ts-ignore
          this.openai.files.del(fileId).catch((err) =>
            //@ts-ignore
            this.logger_.warn(
              `Error eliminando archivo ${fileId}:`,
              //@ts-ignore
              err.message
            )
          )
        );
      }

      // ✅ SOLO ELIMINAR ASSISTANT SI NO ES EL COMPARTIDO (assistantId !== null)
      if (assistantId) {
        cleanupPromises.push(
          //@ts-ignore
          this.openai.beta.assistants.del(assistantId).catch((err) =>
            //@ts-ignore
            this.logger_.warn(
              `Error eliminando asistente ${assistantId}:`,
              //@ts-ignore
              err.message
            )
          )
        );
        this.logger_.info(`🗑️ Eliminando assistant temporal: ${assistantId}`);
      } else {
        this.logger_.info("♻️ Manteniendo assistant compartido");
      }

      await Promise.allSettled(cleanupPromises);
      this.logger_.info("🧹 Recursos de OpenAI limpiados");
    } catch (error: any) {
      //@ts-ignore
      this.logger_.warn(
        "Advertencia limpiando recursos OpenAI:",
        //@ts-ignore
        error.message
      );
    }
  }

  // ✅ DETECCIÓN DE FORMATO POR MAGIC BYTES
  private detectFileFormatFromBuffer(buffer: Buffer): {
    mimeType: string;
    defaultName: string;
    method: string;
  } {
    const magicBytes = buffer.slice(0, 8);

    // PDF magic bytes: %PDF
    if (magicBytes.toString("ascii", 0, 4) === "%PDF") {
      return {
        mimeType: "application/pdf",
        defaultName: "documento.pdf",
        method: "magic_bytes_pdf",
      };
    }

    // JPEG magic bytes: FF D8
    if (magicBytes[0] === 0xff && magicBytes[1] === 0xd8) {
      return {
        mimeType: "image/jpeg",
        defaultName: "documento.jpg",
        method: "magic_bytes_jpeg",
      };
    }

    // PNG magic bytes: 89 50 4E 47
    if (
      magicBytes[0] === 0x89 &&
      magicBytes[1] === 0x50 &&
      magicBytes[2] === 0x4e &&
      magicBytes[3] === 0x47
    ) {
      return {
        mimeType: "image/png",
        defaultName: "documento.png",
        method: "magic_bytes_png",
      };
    }

    // Fallback: asumir PDF para documentos bancarios
    return {
      mimeType: "application/pdf",
      defaultName: "documento.pdf",
      method: "fallback_pdf",
    };
  }

  // Método adicional para verificar ambos lados
  async verifyBothSides(
    frontImageBase64: string,
    backImageBase64: string
  ): Promise<{
    front: VerificationResult;
    back: VerificationResult;
    crossValidation: {
      isConsistent: boolean;
      issues: string[];
    };
  }> {
    this.logger_.info("🔄 Verificando ambos lados del DNI/NIE...");

    const [frontResult, backResult] = await Promise.all([
      this.verifyIdentityDocument(frontImageBase64, "front"),
      this.verifyIdentityDocument(backImageBase64, "back"),
    ]);

    // Cross-validation básica
    const crossValidation = {
      isConsistent: true,
      issues: [] as string[],
    };

    // Verificar que ambos sean válidos
    if (!frontResult.isValid || !backResult.isValid) {
      crossValidation.isConsistent = false;
      crossValidation.issues.push(
        "Uno o ambos lados del documento no son válidos"
      );
    }

    // Verificar calidad de imagen
    if (
      frontResult.imageQuality === "poor" ||
      backResult.imageQuality === "poor"
    ) {
      crossValidation.issues.push(
        "La calidad de una o ambas imágenes es deficiente"
      );
    }

    this.logger_.info("✅ Cross-validation completada");

    return {
      front: frontResult,
      back: backResult,
      crossValidation,
    };
  }

  // ✅ LIMPIAR EL ASSISTANT COMPARTIDO AL CERRAR EL SERVICIO
  async cleanup() {
    if (this.sharedAssistant && this.assistantInitialized) {
      try {
        this.logger_.info(
          "🧹 Limpiando assistant compartido al cerrar servicio..."
        );
        //@ts-ignore
        await this.openai.beta.assistants.del(this.sharedAssistant.id);
        this.sharedAssistant = null;
        this.assistantInitialized = false;
        this.logger_.info("✅ Assistant compartido eliminado");
      } catch (error: any) {
        //@ts-ignore
        this.logger_.warn(
          "Advertencia limpiando assistant compartido:",
          //@ts-ignore
          error.message
        );
      }
    }
  }

  // Método para obtener el estado del servicio
  async getServiceStatus() {
    return {
      service: "Document Verification Module",
      status: "healthy",
      hasApiKey: !!process.env.OPENAI_API_KEY,
      hasSharedAssistant: !!this.sharedAssistant,
      assistantInitialized: this.assistantInitialized,
      timestamp: new Date().toISOString(),
    };
  }
}
