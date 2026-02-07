variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Droplet region"
  type        = string
  default     = "sgp1"
}

variable "droplet_name" {
  description = "Droplet name"
  type        = string
  default     = "ujuz-app"
}

variable "size" {
  description = "Droplet size"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "image" {
  description = "Droplet OS image"
  type        = string
  default     = "ubuntu-24-04-x64"
}

variable "ssh_fingerprint" {
  description = "SSH public key fingerprint (optional)"
  type        = string
  default     = ""
}

variable "container_image" {
  description = "Container image (e.g. ghcr.io/qetta/ujuz-server)"
  type        = string
  default     = "ghcr.io/qetta/ujuz-server"
}

variable "container_tag" {
  description = "Container tag to deploy"
  type        = string
  default     = "latest"
}
