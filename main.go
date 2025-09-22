package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gopkg.in/gomail.v2"
)

// Estrutura para receber as credenciais do SMTP na requisição.
// Os campos `json:"..."` garantem que o Go entenda o JSON em camelCase.
// Os campos `binding:"required"` garantem que a requisição falhe se algum campo faltar.
type SmtpConfig struct {
	From     string `json:"from" binding:"required,email"`
	Host     string `json:"host" binding:"required"`
	Port     int    `json:"port" binding:"required"`
	Username string `json:"username" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Estrutura completa da requisição que o seu endpoint vai receber.
type EmailRequest struct {
	SmtpConfig SmtpConfig `json:"smtpConfig" binding:"required"`
	SendTo     string     `json:"sendTo" binding:"required,email"`
	Subject    string     `json:"subject" binding:"required"`
	Body       string     `json:"body" binding:"required"` // Corpo em HTML com CSS
}

func main() {
	// Inicia o servidor Gin
	router := gin.Default()

	// Cria o endpoint POST em '/send-email'
	router.POST("/send-email", func(c *gin.Context) {
		var request EmailRequest

		// Tenta mapear o JSON do corpo da requisição para a nossa struct 'EmailRequest'.
		// Se houver erro (campo faltando, tipo errado), retorna um erro 400.
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Corpo da requisição inválido: " + err.Error(),
			})
			return
		}

		// 1. Cria a mensagem de e-mail usando os dados da requisição.
		m := gomail.NewMessage()
		m.SetHeader("From", request.SmtpConfig.From)
		m.SetHeader("To", request.SendTo)
		m.SetHeader("Subject", request.Subject)
		m.SetBody("text/html", request.Body) // Importante: define o corpo como HTML

		// 2. Configura a conexão com o servidor SMTP (o "discador").
		// Usa as credenciais que vieram na própria requisição.
		d := gomail.NewDialer(
			request.SmtpConfig.Host,
			request.SmtpConfig.Port,
			request.SmtpConfig.Username,
			request.SmtpConfig.Password,
		)

		log.Printf("Tentando enviar e-mail de '%s' para '%s'...\n", request.SmtpConfig.From, request.SendTo)

		// 3. Tenta conectar ao servidor SMTP e enviar o e-mail.
		if err := d.DialAndSend(m); err != nil {
			log.Printf("ERRO: Falha ao enviar e-mail: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Falha ao enviar o e-mail",
				"details": err.Error(),
			})
			return
		}

		log.Println("Sucesso: E-mail enviado!")
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "E-mail enviado com sucesso!",
		})
	})

	// Inicia o servidor na porta 8080
	log.Println("Serviço de e-mail 'email-sender' iniciado na porta 8080")
	router.Run(":8080")
}