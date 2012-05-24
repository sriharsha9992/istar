// g++ -lPocoFoundation -lPocoNet -lPocoNetSSL -lPocoUtil -lPocoCrypto -lPocoXML pocomail.cpp -o pocomail

#include <iostream>
#include "Poco/Net/MailMessage.h"
#include "Poco/Net/MailRecipient.h"
#include "Poco/Net/SMTPClientSession.h"

using namespace std;
using Poco::Net::MailMessage;
using Poco::Net::MailRecipient;
using Poco::Net::SMTPClientSession;

int main()
{
	MailMessage message;
	message.setSender("istar@Gmail.com");
	message.addRecipient(MailRecipient(MailRecipient::PRIMARY_RECIPIENT, "user@mail.com"));
	message.setSubject("Your istar job completed");
	message.setContentType("text/plain; charset=\"utf-8\"");
	message.setContent("http://istar.cse.cuhk.edu.hk", MailMessage::ENCODING_8BIT);
// socks.cse.cuhk.edu.hk:1080
	SMTPClientSession session("smtp.gmail.com", 587);
	session.login(SMTPClientSession::AUTH_LOGIN, "istar@Gmail.com", "2qR8dVM9d");
	session.sendMessage(message);
	session.close();

	return 0;
}