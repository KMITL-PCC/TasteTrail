import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";

import Link from "next/link";

const FeedbackButton = () => {
  return (
    <Button
      className="fixed -rotate-90 translate-y-1/2 -right-10 bottom-1/2"
      asChild
    >
      <Link
        href="https://docs.google.com/forms/d/e/1FAIpQLScjPUtaECKkr2Bzs3Q4ZyLt5o-9Sh1i9E616MqFxxkU5j1svw/viewform"
        target="_blank"
      >
        <MessageCircle className="w-4 h-4" />
        Feedback
      </Link>
    </Button>
  );
};
export default FeedbackButton;
