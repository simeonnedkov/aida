<?php
// Настройки за имейл
$to_email = "info@aidastil.bg";
$from_email = "noreply@aidastil.bg";
$from_name = "АИДА СТИЛ - Сайт";
$subject_prefix = "Запитване от сайта - ";

// Проверка дали формата е изпратена чрез POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Получаване и почистване на данните
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone']);
    $message = trim($_POST['message']);
    
    // Валидация на задължителните полета
    $errors = array();
    
    if (empty($name)) {
        $errors[] = "Името е задължително";
    }
    
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Валиден имейл адрес е задължителен";
    }
    
    if (empty($message)) {
        $errors[] = "Съобщението е задължително";
    }
    
    // Ако има грешки, върни ги
    if (!empty($errors)) {
        echo json_encode(array('success' => false, 'errors' => $errors));
        exit;
    }
    
    // Подготовка на имейл headers за по-добра доставимост
    $headers = array();
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/html; charset=UTF-8";
    $headers[] = "From: " . $from_name . " <" . $from_email . ">";
    $headers[] = "Reply-To: " . $name . " <" . $email . ">";
    $headers[] = "Return-Path: " . $from_email;
    $headers[] = "X-Mailer: PHP/" . phpversion();
    $headers[] = "X-Priority: 3";
    
    // Тема на имейла
    $subject = $subject_prefix . "От " . $name;
    
    // HTML съдържание на имейла
    $email_body = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Ново запитване от сайта</title>
    </head>
    <body>
        <h2>Ново запитване от сайта на АИДА СТИЛ</h2>
        <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; width: 100%;'>
            <tr>
                <td><strong>Име:</strong></td>
                <td>" . htmlspecialchars($name) . "</td>
            </tr>
            <tr>
                <td><strong>Имейл:</strong></td>
                <td>" . htmlspecialchars($email) . "</td>
            </tr>
            <tr>
                <td><strong>Телефон:</strong></td>
                <td>" . htmlspecialchars($phone) . "</td>
            </tr>
            <tr>
                <td><strong>Съобщение:</strong></td>
                <td>" . nl2br(htmlspecialchars($message)) . "</td>
            </tr>
            <tr>
                <td><strong>Дата:</strong></td>
                <td>" . date('d.m.Y H:i:s') . "</td>
            </tr>
        </table>
    </body>
    </html>
    ";
    
    $attachments = array();
    $total_size = 0;
    $boundary = md5(time());
    
    // Проверка за прикачени файлове от 3-те отделни полета
    $file_inputs = array('attachment1', 'attachment2', 'attachment3');
    
    foreach ($file_inputs as $input_name) {
        if (isset($_FILES[$input_name]) && $_FILES[$input_name]['error'] != UPLOAD_ERR_NO_FILE) {
            
            // Проверка за грешки при качване
            if ($_FILES[$input_name]['error'] != 0) {
                $errors[] = "Грешка при качване на файл: " . $_FILES[$input_name]['name'];
                continue;
            }
            
            $file_tmp = $_FILES[$input_name]['tmp_name'];
            $file_name = $_FILES[$input_name]['name'];
            $file_size = $_FILES[$input_name]['size'];
            
            // Проверка на размера на отделния файл (максимум 5MB)
            if ($file_size > 5 * 1024 * 1024) {
                $errors[] = "Файлът '" . $file_name . "' е твърде голям. Максимален размер: 5MB";
                continue;
            }
            
            // Проверка на общия размер на всички файлове (максимум 10MB)
            $total_size += $file_size;
            if ($total_size > 10 * 1024 * 1024) {
                $errors[] = "Общият размер на всички файлове не може да надвишава 10MB";
                break;
            }
            
            // Разрешени типове файлове
            $allowed_types = array('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt');
            $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
            
            if (!in_array($file_ext, $allowed_types)) {
                $errors[] = "Неразрешен тип файл: " . $file_name;
                continue;
            }
            
            $attachments[] = array(
                'name' => $file_name,
                'content' => file_get_contents($file_tmp),
                'type' => mime_content_type($file_tmp)
            );
        }
    }
    
    // Ако има грешки от файловете, върни ги
    if (!empty($errors)) {
        echo json_encode(array('success' => false, 'errors' => $errors));
        exit;
    }
    
    if (!empty($attachments)) {
        $headers[] = "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"";
        
        $email_message = "--" . $boundary . "\r\n";
        $email_message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $email_message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $email_message .= $email_body . "\r\n\r\n";
        
        foreach ($attachments as $attachment) {
            $email_message .= "--" . $boundary . "\r\n";
            $email_message .= "Content-Type: " . $attachment['type'] . "; name=\"" . $attachment['name'] . "\"\r\n";
            $email_message .= "Content-Transfer-Encoding: base64\r\n";
            $email_message .= "Content-Disposition: attachment; filename=\"" . $attachment['name'] . "\"\r\n\r\n";
            $email_message .= chunk_split(base64_encode($attachment['content'])) . "\r\n";
        }
        
        $email_message .= "--" . $boundary . "--";
    } else {
        $email_message = $email_body;
    }
    
    // Изпращане на имейла
    if (mail($to_email, $subject, $email_message, implode("\r\n", $headers))) {
        $attachment_count = count($attachments);
        $success_message = 'Съобщението е изпратено успешно!';
        if ($attachment_count > 0) {
            $success_message .= ' (' . $attachment_count . ' файла прикачени)';
        }
        echo json_encode(array('success' => true, 'message' => $success_message));
    } else {
        echo json_encode(array('success' => false, 'errors' => array('Грешка при изпращане на имейла')));
    }
    
} else {
    // Ако не е POST заявка
    echo json_encode(array('success' => false, 'errors' => array('Невалидна заявка')));
}
?>
