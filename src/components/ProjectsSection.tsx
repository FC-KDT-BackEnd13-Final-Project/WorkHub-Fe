import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ExternalLink, Github } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function ProjectsSection() {
  const projects = [
    {
      title: "E-Commerce Platform",
      description: "A full-stack e-commerce platform built with React, Node.js, and MongoDB. Features include product management, shopping cart, and secure payment integration.",
      image: "https://images.unsplash.com/photo-1557821552-17105176677c?w=600&h=400&fit=crop",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      title: "Task Management App",
      description: "A collaborative task management application with real-time updates, drag-and-drop interface, and team collaboration features.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
      technologies: ["React", "TypeScript", "Firebase", "Tailwind CSS"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      title: "Weather Dashboard",
      description: "A responsive weather dashboard that displays current weather, forecasts, and interactive maps using external APIs.",
      image: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&h=400&fit=crop",
      technologies: ["React", "OpenWeather API", "Chart.js"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      title: "Social Media Dashboard",
      description: "An analytics dashboard for tracking social media metrics with real-time data visualization and performance insights.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
      technologies: ["Next.js", "PostgreSQL", "Recharts", "Tailwind CSS"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      title: "AI Content Generator",
      description: "An AI-powered content generation tool that helps create engaging copy for various platforms using natural language processing.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
      technologies: ["React", "OpenAI API", "TypeScript"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      title: "Portfolio Builder",
      description: "A drag-and-drop portfolio builder that allows users to create professional portfolios without coding knowledge.",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop",
      technologies: ["React", "Node.js", "MongoDB", "AWS S3"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
  ];

  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium mb-4">
            Featured Projects
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A selection of projects I've worked on, showcasing
            different technologies and approaches to
            problem-solving.
          </p>
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
                    <Button
                      size="sm"
                      variant="secondary"
                      asChild
                    >
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Live Demo
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      asChild
                    >
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4 mr-2" />
                        Code
                      </a>
                    </Button>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">
                    {project.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="text-xs"
                      >
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
              href="https://github.com"
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