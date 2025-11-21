import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";

export function SkillsSection() {
  const skillCategories = [
    {
      title: "Frontend",
      skills: [
        "React 18",
        "sonner",
        "TypeScript",
        "Tailwind CSS",
        "Framer Motion",
        "React DnD",
      ],
    },
    {
      title: "Backend",
      skills: [
        "Java21",
        "Spring boot",
        "Spring security",
        "QueryDsl",
        "JPA",
        "Express.js",
      ],
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
    { name: "Docker", level: 20 }
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
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive overview of the technologies and tools I work with to bring ideas to life.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-medium mb-6">
              Proficiency
            </h3>
            <div className="space-y-6">
              {mainSkills.map((skill, index) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {skill.name}
                    </span>
                    <span className="text-muted-foreground">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-primary rounded-full h-2"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      transition={{
                        duration: 1,
                        delay: index * 0.1,
                      }}
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
                transition={{
                  duration: 0.6,
                  delay: categoryIndex * 0.1,
                }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4">
                      {category.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
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