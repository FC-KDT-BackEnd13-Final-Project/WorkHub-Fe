import { Card, CardContent } from "./ui/card";
import { Code2, Palette, Zap } from "lucide-react";
import { motion } from "motion/react";

export function AboutSection() {
  const highlights = [
    {
      icon: Code2,
      title: "Clean Code",
      description:
        "Writing maintainable, scalable, and well-documented code that follows best practices.",
    },
    {
      icon: Palette,
      title: "UI/UX Focus",
      description:
        "Creating intuitive and beautiful user interfaces with attention to detail and user experience.",
    },
    {
      icon: Zap,
      title: "Performance",
      description:
        "Building fast, optimized applications with excellent performance and loading speeds.",
    },
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium mb-4">
            About Project
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            웹 개발사와 고객사가 계약부터 하자보수까지 
            모든 프로젝트 과정을 한 화면에서 확인하고 컨펌할 수 있는 B2B 협업 플랫폼
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-medium mb-4">
              My Journey
            </h3>
            <p className="text-muted-foreground mb-4">
              My journey in software development began during my
              computer science studies, where I discovered my
              passion for creating digital solutions. Over the
              years, I've worked with startups and established
              companies, building everything from simple landing
              pages to complex enterprise applications.
            </p>
            <p className="text-muted-foreground mb-4">
              I believe in continuous learning and staying
              up-to-date with the latest technologies and
              industry trends. When I'm not coding, you can find
              me contributing to open-source projects, reading
              tech blogs, or exploring new frameworks and tools.
            </p>
            <p className="text-muted-foreground">
              I'm always excited to take on new challenges and
              collaborate with teams to build amazing products
              that make a difference.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8 text-center"
          >
            <div className="w-32 h-32 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Code2 className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              John Doe
            </h3>
            <p className="text-muted-foreground mb-4">
              Full Stack Developer
            </p>
            <p className="text-muted-foreground">
              Based in San Francisco, CA
              <br />
              Available for freelance projects
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardContent className="p-6 text-center">
                  <highlight.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-medium mb-2">
                    {highlight.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {highlight.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}