// Importa as bibliotecas necessárias
const express = require("express");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");

// Inicia o servidor Express (equivalente a gin.Default())
const app = express();
const PORT = 8080;

// Middleware para que o Express consiga ler o corpo da requisição em JSON
// (equivalente a c.ShouldBindJSON())
app.use(express.json());

// Cria o endpoint POST em '/send-email'
app.post(
  "/send-email",
  // Array de middlewares de validação (equivalente aos `binding:"required,email"`)
  [
    body(
      "smtpConfig.from",
      'O campo "from" é obrigatório e deve ser um e-mail válido.'
    ).isEmail(),
    body("smtpConfig.host", 'O campo "host" é obrigatório.').notEmpty(),
    body(
      "smtpConfig.port",
      'O campo "port" é obrigatório e deve ser um número inteiro.'
    ).isInt(),
    body(
      "smtpConfig.username",
      'O campo "username" é obrigatório e deve ser um e-mail válido.'
    ).isEmail(),
    body("smtpConfig.password", 'O campo "password" é obrigatório.').notEmpty(),
    body(
      "sendTo",
      'O campo "sendTo" é obrigatório e deve ser um e-mail válido.'
    ).isEmail(),
    body("subject", 'O campo "subject" é obrigatório.').notEmpty(),
    body("body", 'O campo "body" (corpo do e-mail) é obrigatório.').notEmpty(),
  ],
  // A função principal que lida com a requisição, usando async/await para operações assíncronas
  async (req, res) => {
    // Verifica se houve erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Se houver erros, retorna um status 400 com os detalhes
      return res.status(400).json({
        status: "error",
        message: "Corpo da requisição inválido",
        errors: errors.array(),
      });
    }

    // Extrai os dados do corpo da requisição
    const { smtpConfig, sendTo, subject, body } = req.body;

    try {
      // 1. Configura a conexão com o servidor SMTP (o "transporter" do Nodemailer)
      //    (equivalente ao gomail.NewDialer())
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        // `secure: true` se a porta for 465 (SSL), senão o Nodemailer decide
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
      });

      // 2. Cria a mensagem de e-mail usando os dados da requisição
      //    (equivalente ao gomail.NewMessage())
      const mailOptions = {
        from: smtpConfig.from,
        to: sendTo,
        subject: subject,
        html: body, // Importante: 'html' para interpretar o corpo como HTML
      };

      console.log(
        `Tentando enviar e-mail de '${smtpConfig.from}' para '${sendTo}'...`
      );

      // 3. Tenta enviar o e-mail
      //    (equivalente a d.DialAndSend(m))
      await transporter.sendMail(mailOptions);

      console.log("Sucesso: E-mail enviado!");
      res.status(200).json({
        status: "success",
        message: "E-mail enviado com sucesso!",
      });
    } catch (error) {
      console.error(`ERRO: Falha ao enviar e-mail: ${error.message}`);
      // Em caso de erro no envio, retorna um status 500
      res.status(500).json({
        status: "error",
        message: "Falha ao enviar o e-mail",
        details: error.message,
      });
    }
  }
);

// Inicia o servidor na porta 8080 (equivalente a router.Run(":8080"))
app.listen(PORT, () => {
  console.log(
    `Serviço de e-mail 'email-sender-node' iniciado na porta ${PORT}`
  );
});
