import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowDown,
  Building2,
  Calendar,
  Github,
  MessageCircle,
  Send,
  Zap,
} from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LoginScreen } from "./Login";
import logoImage from "../../image/logo.png";

interface MainProps {
  onLoginSuccess?: () => void;
}

export function Main({ onLoginSuccess }: MainProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (!isLoginOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLoginOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoginOpen]);

  return (
    <main>
      <HeroSection onOpenLogin={() => setIsLoginOpen(true)} />
      <AboutSection />
      <SkillsSection />
      <TeamSection />
      <ExperienceSection />
      <ContactSection />
      {isLoginOpen && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-end px-0">
          <div
            className="absolute inset-0"
            onClick={() => setIsLoginOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 h-full max-w-lg w-full overflow-y-auto bg-white shadow-2xl border-l">
            <LoginScreen
              onSuccess={() => {
                setIsLoginOpen(false);
                onLoginSuccess?.();
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function HeroSection({ onOpenLogin }: { onOpenLogin: () => void }) {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center pt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="flex justify-center mb-6"
          >
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-3xl bg-white/90 shadow-lg flex items-center justify-center">
              <motion.img
                src={logoImage}
                alt="Work Hub Logo"
                className="h-16 w-16 md:h-16 md:w-16"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-medium mb-8"
          >
            WORK HUB
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            설계부터 하자보수까지 한 곳에서 하나의 흐름으로 작업할 수 있는 공간
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button size="lg" onClick={onOpenLogin} className="sm:w-auto">
              Sign in
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="animate-bounce"
          >
            <Button variant="ghost" onClick={() => scrollToSection("about")} className="p-2">
              <ArrowDown className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function AboutSection() {
  const highlights = [
    {
      image: logoImage,
      title: "프로젝트 전 과정 통합 관리",
      description: "계약부터 하자보수까지 한 곳에서 관리",
    },
    {
      icon: MessageCircle,
      iconColor: "var(--point-color)",
      title: "커뮤니케이션 효율성 향상",
      description: "파일·코멘트·승인 이력을 한 화면에서 확인",
    },
    {
      icon: Zap,
      iconColor: "var(--point-color)",
      title: "권한 기반 B2B 시스템",
      description: "고객사·프로젝트별 접근 권한을 세분화하여 안전 운영",
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
          <h2 className="text-3xl md:text-4xl font-medium mb-4">About Project</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-12 items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-medium mb-4">개발 배경</h3>
            <p className="text-muted-foreground mb-4">
              최근 많은 웹 개발사와 에이전시들은
              <br />
              계약부터 하자보수까지의 프로젝트를 여전히 이메일·메신저·전화·엑셀로 관리하고 있어,
              <br />
              중요한 내용이 흩어지고 담당자가 바뀌면 기록을 다시 찾아봐야 하는 비효율이 반복됩니다.
            </p>
            <p className="text-muted-foreground mb-4">
              여러 프로젝트를 동시에 진행하면 진행 단계·승인 내역·최신 파일을 한눈에 보기 어려워
              <br />
              커뮤니케이션 오류와 일정 지연, 책임 소재 불명확으로 이어지고, 결국 고객 신뢰와 작업 품질이 떨어집니다.
            </p>
            <p className="text-muted-foreground mb-4">
              이러한 문제를 해결하기 위해 우리는 웹 개발사와 고객사가 한 곳에서
              <br />
              프로젝트별 체크리스트, 파일, 승인 이력, 코멘트, 하자보수 요청을 한눈에 볼 수 있는
              <br />
              B2B 프로젝트 관리 시스템 Work Hub를 개발해, 보다 투명하고 체계적인 운영이 가능하도록 했습니다.
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
                  {highlight.image ? (
                    <img
                      src={highlight.image}
                      alt={`${highlight.title} 로고`}
                      className="h-12 w-12 mx-auto mb-4 object-contain"
                    />
                  ) : (
                    <highlight.icon
                      className={`h-12 w-12 mx-auto mb-4 ${
                        highlight.iconColor ? "" : "text-primary"
                      }`}
                      style={
                        highlight.iconColor ? { color: highlight.iconColor } : undefined
                      }
                    />
                  )}
                  <h3 className="font-medium mb-2">{highlight.title}</h3>
                  <p className="text-muted-foreground">{highlight.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  const skillCategories = [
    {
      title: "Frontend",
      skills: ["React 18", "sonner", "TypeScript", "Tailwind CSS", "Framer Motion", "React DnD"],
    },
    {
      title: "Backend",
      skills: ["Java21", "Spring boot", "Spring security", "QueryDsl", "JPA", "Express.js"],
    },
    {
      title: "Database",
      skills: ["PostgreSQL", "Redis"],
    },
    {
      title: "DevOps & Tools",
      skills: ["Docker", "GitHub Actions", "Swagger"],
    },
  ];

  const mainSkills = [
    { name: "React/Tailwind CSS", level: 30 },
    { name: "TypeScript", level: 20 },
    { name: "Java21", level: 10 },
    { name: "Python", level: 15 },
    { name: "PostgreSQL", level: 5 },
    { name: "Docker", level: 20 },
  ];

  return (
    <section id="skills" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium mb-4">Skills & Technologies</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-medium mb-6">Proficiency</h3>
            <div className="space-y-6">
              {mainSkills.map((skill, index) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-primary rounded-full h-2"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {skillCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4">{category.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  const projects = [
    {
      title: "Yunyeong",
      description: "어필하셈",
      image: "/image/Yunyeong.jpg",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      githubUrl: "https://github.com/onuyyy",
    },
    {
      title: "Gunhee",
      description: "어필하셈",
      image: "/image/Gunhee.jpg",
      technologies: ["React", "TypeScript", "Firebase", "Tailwind CSS"],
      githubUrl: "https://github.com/dkqpeo",
    },
    {
      title: "Jieun",
      description: "어필하셈",
      image: "image/Jieun.jpg",
      technologies: ["React", "OpenWeather API", "Chart.js"],
      githubUrl: "https://github.com/kimjieun666",
    },
    {
      title: "Ayeon",
      description: "어필하셈",
      image: "image/Ayeon.jpg",
      technologies: ["Next.js", "PostgreSQL", "Recharts", "Tailwind CSS"],
      githubUrl: "https://github.com/zneda330",
    },
    {
      title: "Jaewoong",
      description: "어필하셈",
      image: "image/Jaewoong.jpg",
      technologies: ["React", "OpenAI API", "TypeScript"],
      githubUrl: "https://github.com/JWoong-01",
    },
    {
      title: "Kyungseo",
      description: "어필하셈",
      image: "image/Kyungseo.jpg",
      technologies: ["React", "Node.js", "MongoDB", "AWS S3"],
      githubUrl: "https://github.com/willbewallstreet",
    },
  ];

  return (
    <section id="team" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium mb-4">Team members</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto"></p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full group hover:shadow-lg transition-shadow duration-300">
                <div className="relative overflow-hidden">
                  <ImageWithFallback
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                    <Button size="sm" variant="secondary" asChild></Button>
                    <Button size="sm" variant="secondary" asChild>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        github
                      </a>
                    </Button>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://github.com/FC-KDT-BackEnd13-Final-Project/WorkHub-Server"
              target="_blank"
              rel="noopener noreferrer"
            >
              View All Projects on GitHub
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  const experiences = [
    {
      title: "프로젝트 설계",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "1Week",
      description: "ERD 및 화면정의서 설계, 프로젝트 세팅",
      technologies: ["React", "TypeScript", "Git", "CSS"],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "2Week",
      description: "작업 진행사항",
      technologies: ["사용한 기술"],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "3Week",
      description: "작업 진행사항",
      technologies: ["사용한 기술"],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "4Week",
      description: "작업 진행사항",
      technologies: ["사용한 기술"],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "5Week",
      description: "작업 진행사항",
      technologies: ["사용한 기술"],
    },
  ];

  return (
    <section id="experience" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium mb-4">Project Development Journey</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Developed as part of a 5-week bootcamp, this project followed a full development lifecycle
            including planning, design, implementation, and improvement.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border md:transform md:-translate-x-px"></div>

            <div className="space-y-12">
              {experiences.map((experience, index) => (
                <motion.div
                  key={`${experience.title}-${experience.duration}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex flex-col md:flex-row items-start md:items-center ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background md:transform md:-translate-x-2 z-10"></div>

                  <div className={`ml-16 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-8" : "md:pl-8"}`}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-lg">{experience.title}</h3>
                            <div className="flex items-center text-muted-foreground mb-2">
                              <Building2 className="h-4 w-4 mr-1" />
                              <span>{experience.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground text-sm mb-4">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{experience.duration}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                          {experience.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {experience.technologies.map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="hidden md:block md:w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Message sent successfully!", {
      description: "I'll get back to you as soon as possible.",
    });

    setFormData({ name: "", email: "", message: "" });
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium mb-4">Get In Touch</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have a project in mind or want to collaborate? Feel free to reach out!
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Your message..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
