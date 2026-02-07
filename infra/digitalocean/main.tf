resource "digitalocean_droplet" "app" {
  name   = var.droplet_name
  region = var.region
  size   = var.size
  image  = var.image

  ssh_keys = var.ssh_fingerprint != "" ? [var.ssh_fingerprint] : []

  user_data = templatefile("${path.module}/cloud-init.tpl", {
    image = var.container_image
    tag   = var.container_tag
  })

  tags = ["ujuz"]
}

resource "digitalocean_firewall" "app" {
  name        = "${var.droplet_name}-fw"
  droplet_ids = [digitalocean_droplet.app.id]

  # SSH: restricted by var.ssh_allowed_cidrs (set to your IP in production)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.ssh_allowed_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
