// g++ -lPocoNet pocomail.cpp -o pocomail

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
	message.setSender("istar.cuhk@gmail.com");
	message.addRecipient(MailRecipient(MailRecipient::PRIMARY_RECIPIENT, "jackyleehongjian@mail.com"));
	message.setSubject("Your istar job completed");
	message.setContentType("text/plain; charset=\"utf-8\"");
	message.setContent("View result at http://istar.cse.cuhk.edu.hk", MailMessage::ENCODING_8BIT);
// socks.cse.cuhk.edu.hk:1080
	SMTPClientSession session("smtp.gmail.com", 587);
	cout << "login\n";
	session.login(SMTPClientSession::AUTH_LOGIN, "istar.cuhk", "2qR8dVM9d");
	cout << "send\n";
	session.sendMessage(message);
	cout << "close\n";
	session.close();

	return 0;
}
