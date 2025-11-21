import { Github, Linkedin, Mail, Heart } from "lucide-react";
import { Button } from "./ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-muted-foreground flex items-center">
              Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> by John Doe
            </p>
            <p className="text-muted-foreground text-sm">
              © {currentYear} All rights reserved.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a 
                href="mailto:john.doe@example.com"
                className="p-2"
              >
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}