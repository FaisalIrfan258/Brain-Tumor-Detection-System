import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from torchvision.models import ResNet18_Weights
import numpy as np
import cv2

# Device configuration
import os

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class BrainTumorClassifier(nn.Module):
    def __init__(self, pretrained=True):
        super(BrainTumorClassifier, self).__init__()
        # Use ResNet18 as backbone
        self.backbone = models.resnet18(weights=ResNet18_Weights.DEFAULT if pretrained else None)
        # Replace the final layer for binary classification
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1)
        )

    def forward(self, x):
        return self.backbone(x)

class GradCAM:
    def __init__(self, model, target_layer_name='backbone.layer4'):
        self.model = model
        self.target_layer_name = target_layer_name
        self.gradients = None
        self.activations = None
        self.hooks = []
        self.register_hooks()

    def register_hooks(self):
        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]
        def forward_hook(module, input, output):
            self.activations = output
        # Get the target layer
        target_layer = dict([*self.model.named_modules()])[self.target_layer_name]
        # Register hooks
        hook1 = target_layer.register_backward_hook(backward_hook)
        hook2 = target_layer.register_forward_hook(forward_hook)
        self.hooks = [hook1, hook2]

    def generate_cam(self, input_image, class_idx=None):
        self.model.eval()
        model_output = self.model(input_image)
        self.model.zero_grad()
        model_output[0][0].backward(retain_graph=True)
        if self.gradients is None or self.activations is None:
            return np.zeros((224, 224))
        gradients = self.gradients[0].cpu().data.numpy()
        activations = self.activations[0].cpu().data.numpy()
        weights = np.mean(gradients, axis=(1, 2))
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]
        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (224, 224))
        if cam.max() > 0:
            cam = cam / cam.max()
        return cam

    def remove_hooks(self):
        for hook in self.hooks:
            hook.remove()

# Initialize model
model = BrainTumorClassifier(pretrained=True)
# Load your trained model weights
checkpoint = torch.load(os.path.join(os.path.dirname(__file__), 'brain_tumor_detection_model_complete.pth'), map_location=device)
if "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])
else:
    model.load_state_dict(checkpoint)
model = model.to(device)
model.eval()

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
]) 