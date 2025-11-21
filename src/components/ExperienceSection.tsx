import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Building2, Calendar } from "lucide-react";
import { motion } from "motion/react";

export function ExperienceSection() {
  const experiences = [
    {
      title: "프로젝트 설계",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "1Week",
      description:
        "ERD 및 화면정의서 설계, 프로젝트 세팅",
      technologies: [
        "React",
        "TypeScript",
        "Git",
        "CSS",
      ],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "2Week",
      description:
        "작업 진행사항",
      technologies: [
        "사용한 기술",
      ],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "3Week",
      description:
        "작업 진행사항",
      technologies: [
        "사용한 기술",
      ],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "4Week",
      description:
        "작업 진행사항",
      technologies: [
        "사용한 기술",
      ],
    },
    {
      title: "기본 타이틀",
      location: "패스트캠퍼스 AI 백엔드 부트캠프",
      duration: "5Week",
      description:
        "작업 진행사항",
      technologies: [
        "사용한 기술",
      ],
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
          <h2 className="text-3xl md:text-4xl font-medium mb-4">
            Work Experience
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            My professional journey in software development,
            from junior developer to senior engineer.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border md:transform md:-translate-x-px"></div>

            <div className="space-y-12">
              {experiences.map((experience, index) => (
                <motion.div
                  key={`${experience.title}-${experience.duration}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                  }}
                  viewport={{ once: true }}
                  className={`relative flex flex-col md:flex-row items-start md:items-center ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background md:transform md:-translate-x-2 z-10"></div>

                  {/* Content */}
                  <div
                    className={`ml-16 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-8" : "md:pl-8"}`}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-lg">
                              {experience.title}
                            </h3>
                            <div className="flex items-center text-muted-foreground mb-2">
                              <Building2 className="h-4 w-4 mr-1" />
                              <span>
                                {experience.location}
                              </span>
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
                          {experience.technologies.map(
                            (tech) => (
                              <Badge
                                key={tech}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tech}
                              </Badge>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Empty space for alternating layout on desktop */}
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